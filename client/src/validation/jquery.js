import { clearAllErrors, fieldElements, messageElements } from "../messages.js";
import { classList, escapeHtml } from "../utils.js";

// Uses jQuery Validation Unobtrusive when it is on the page, so existing projects keep their behavior,
// including custom rules added with $.validator.addMethod / $.validator.unobtrusive.adapters.

export function hasJQueryValidation() {
  const $ = window.jQuery;
  return !!($ && $.validator && $.validator.unobtrusive);
}

export function createJQueryEngine() {
  return {
    name: "jquery",

    async validate(form, options) {
      const $form = window.jQuery(form);
      const validator = getValidator(form, options);
      let valid = $form.valid();

      // jQuery Validation treats a pending [Remote] check as valid; wait for it, then check again (the result is cached).
      if (validator && validator.pendingRequest > 0) {
        await waitFor(() => validator.pendingRequest === 0, 30000);
        valid = $form.valid();
      }

      return valid;
    },

    validateElement(form, element, options) {
      const validator = getValidator(form, options);
      return Promise.resolve(!validator || window.jQuery(element).valid());
    },

    showErrors(form, errors, options) {
      const validator = getValidator(form, options);
      const map = {};
      const unplaced = [];

      errors.forEach((error) => {
        if (!error.propertyName) {
          return;
        }

        const element = fieldElements(form, error.propertyName)[0];

        // showErrors needs an element and Unobtrusive needs its message element; otherwise show them elsewhere.
        if (validator && element && messageElements(form, element.name).length > 0) {
          map[element.name] = error.messages.map(escapeHtml).join("<br>");
        } else {
          unplaced.push(...error.messages);
        }
      });

      if (validator && Object.keys(map).length > 0) {
        validator.showErrors(map);
      }

      return unplaced;
    },

    clear(form, options) {
      const validator = window.jQuery(form).data("validator");
      if (validator) {
        validator.resetForm();
      }
      clearAllErrors(form, options);
    },

    focusInvalid(form) {
      const validator = window.jQuery(form).data("validator");
      if (validator) {
        validator.focusInvalid();
      }
    }
  };
}

function waitFor(condition, timeout) {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (condition() || Date.now() - started > timeout) {
        clearInterval(timer);
        resolve();
      }
    }, 50);
  });
}

// Uses the form's validator as it is: the page's own (with its settings and the rules it changed) or the one
// Unobtrusive creates. Fields added later (e.g. a dynamic row) get their data-val-* rules added to it.
function getValidator(form, options) {
  const $ = window.jQuery;
  const $form = $(form);

  protectJQueryValidation();

  if (!$form.data("validator")) {
    $.validator.unobtrusive.parse(form);
  }

  const validator = $form.data("validator");

  if (validator) {
    addNewFields(form, validator);

    if (!validator.formhelperHooked) {
      validator.formhelperHooked = true;
      addCssClassHooks(form, validator, options);
    }
  }

  return validator;
}

// Unobtrusive.parse() doesn't see fields added to a form that already has a validator. Parsing such a field alone
// (parseElement) gives its rules without creating a new validator, so nothing else of the validator changes.
function addNewFields(form, validator) {
  const $ = window.jQuery;
  const settings = validator.settings;
  settings.rules = settings.rules || {};
  settings.messages = settings.messages || {};

  form.querySelectorAll("[data-val=\"true\"]").forEach((element) => {
    if (!element.name || Object.prototype.hasOwnProperty.call(settings.rules, element.name)) {
      return;
    }

    $.validator.unobtrusive.parseElement(element, true);

    const info = $(form).data("unobtrusiveValidation");
    settings.rules[element.name] = (info && info.options.rules[element.name]) || {};
    settings.messages[element.name] = (info && info.options.messages[element.name]) || {};
  });
}

// Makes jQuery Validation safe for server messages and .NET patterns. Called before every validation, and by
// index.js on load (the [Remote] check of a field can run before FormHelper validates the form).
export function protectJQueryValidation() {
  const $ = window.jQuery;

  if (!$ || !$.validator) {
    return;
  }

  // Each time: Unobtrusive may be loaded after this script and (re)define the "regex" method.
  guardRegexMethod();

  if (!$.validator.formhelperRemoteEscaped) {
    $.validator.formhelperRemoteEscaped = true;
    escapeRemoteMessages($);
  }
}

// jQuery Validation shows a [Remote] action's message as html (the field's message and Unobtrusive's summary), and
// such a message often contains what the user typed. The response is escaped before jQuery Validation reads it, so
// the message is shown as text. Its [Remote] requests are the ones with port "validate" + field name.
function escapeRemoteMessages($) {
  $.ajaxPrefilter((options) => {
    if (typeof options.port !== "string" || options.port.indexOf("validate") !== 0) {
      return;
    }

    const dataFilter = options.dataFilter;

    options.dataFilter = function (data, type) {
      data = dataFilter ? dataFilter.call(this, data, type) : data;

      try {
        const response = JSON.parse(data);
        return typeof response === "string" ? JSON.stringify(escapeHtml(response)) : data;
      } catch (e) {
        return data;
      }
    };
  });
}

// Unobtrusive's "regex" method throws for a pattern JavaScript can't parse (e.g. a .NET-only construct), which
// stops the validation of the whole form. Such a pattern is left to the server, like the built-in validator does.
function guardRegexMethod() {
  const methods = window.jQuery.validator.methods;
  const regex = methods.regex;

  if (!regex || regex.formhelperGuarded) {
    return;
  }

  methods.regex = function (value, element, params) {
    try {
      return regex.call(this, value, element, params);
    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        throw e;
      }
      console.warn("FormHelper: the pattern of " + element.name + " is not valid in JavaScript; it is validated on the server only.", e);
      return true;
    }
  };
  methods.regex.formhelperGuarded = true;
}

// Adds the extra classes (e.g. Bootstrap's "is-invalid") next to the standard ones.
function addCssClassHooks(form, validator, options) {
  const settings = validator.settings;
  const highlight = settings.highlight;
  const unhighlight = settings.unhighlight;

  settings.highlight = function (element, errorClass, validClass) {
    if (highlight) {
      highlight.call(this, element, errorClass, validClass);
    }
    element.classList.add(...classList(options.inputErrorClass));
    messageElements(form, element.name).forEach((m) => m.classList.add(...classList(options.messageErrorClass)));
  };

  settings.unhighlight = function (element, errorClass, validClass) {
    if (unhighlight) {
      unhighlight.call(this, element, errorClass, validClass);
    }
    element.classList.remove(...classList(options.inputErrorClass));
    messageElements(form, element.name).forEach((m) => m.classList.remove(...classList(options.messageErrorClass)));
  };
}
