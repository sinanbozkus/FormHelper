import { clearAllErrors, clearFieldErrors, fieldElements, focusFirstInvalid, setSummary, showFieldErrors } from "../messages.js";
import { rules } from "./rules.js";

// The dependency-free validator. Reads the same data-val-* attributes as jQuery Validation Unobtrusive.
// With clientRules = false (data-fh-validation="none") it only shows the server's validation errors.

export function createBuiltInEngine(clientRules) {
  return {
    name: clientRules ? "builtin" : "none",

    async validate(form, options) {
      if (!clientRules) {
        return true;
      }

      const names = validatedFieldNames(form);
      const results = await Promise.all(names.map((name) => validateField(form, name, options)));
      const messages = results.filter((r) => r !== true);

      setSummary(form, messages);
      return messages.length === 0;
    },

    async validateElement(form, element, options) {
      if (!clientRules || !element.name) {
        return true;
      }
      return (await validateField(form, element.name, options)) === true;
    },

    showErrors(form, errors, options) {
      const unplaced = [];

      errors.forEach((error) => {
        if (!error.propertyName) {
          return;
        }
        if (!showFieldErrors(form, error.propertyName, error.messages, options)) {
          unplaced.push(...error.messages);
        }
      });

      return unplaced;
    },

    clear(form, options) {
      clearAllErrors(form, options);
    },

    focusInvalid(form) {
      focusFirstInvalid(form);
    }
  };
}

function validatedFieldNames(form) {
  const names = [];

  Array.from(form.elements).forEach((element) => {
    if (element.name && element.getAttribute("data-val") === "true" && names.indexOf(element.name) === -1) {
      names.push(element.name);
    }
  });

  return names;
}

// Returns true, or the first failing rule's message.
async function validateField(form, name, options) {
  const elements = fieldElements(form, name);
  const element = elements.find((e) => e.getAttribute("data-val") === "true");

  if (!element || isIgnored(element, elements)) {
    return true;
  }

  const value = getValue(elements);

  for (const rule of getRules(element)) {
    const validate = rules[rule.name];

    // Unknown rules are ignored, like Unobtrusive does for adapters it doesn't know.
    if (!validate || (value === "" && rule.name !== "required" && rule.name !== "equalto")) {
      continue;
    }

    let result = validate(value, element, rule.params, form);

    if (result && typeof result.then === "function") {
      result = await result;

      // The user kept typing while the server was asked; the newer validation shows the result.
      if (getValue(fieldElements(form, name)) !== value) {
        return true;
      }
    }

    if (result !== true) {
      const message = typeof result === "string" && result !== "" ? result : rule.message;
      showFieldErrors(form, name, [message], options);
      return message;
    }
  }

  clearFieldErrors(form, name, options);
  return true;
}

// data-val-{rule}="message" and data-val-{rule}-{param}="value". "required" runs first.
function getRules(element) {
  const list = [];
  const attributes = Array.from(element.attributes);

  attributes.forEach((attribute) => {
    const match = /^data-val-([a-z0-9]+)$/i.exec(attribute.name);
    if (!match) {
      return;
    }

    const name = match[1].toLowerCase();

    // Like Unobtrusive: a checkbox (bool) is never "required", it always posts a value.
    if (name === "required" && element.type === "checkbox") {
      return;
    }

    const prefix = "data-val-" + name + "-";
    const params = {};

    attributes.forEach((a) => {
      if (a.name.toLowerCase().indexOf(prefix) === 0) {
        params[a.name.substring(prefix.length).toLowerCase()] = a.value;
      }
    });

    const rule = { name, message: attribute.value, params };

    if (name === "required") {
      list.unshift(rule);
    } else {
      list.push(rule);
    }
  });

  return list;
}

function getValue(elements) {
  const element = elements[0];

  if (element.type === "radio" || element.type === "checkbox") {
    const checked = elements.filter((e) => (e.type === "radio" || e.type === "checkbox") && e.checked);
    return checked.length > 0 ? checked[0].value : "";
  }

  if (element.tagName === "SELECT" && element.multiple) {
    return Array.from(element.selectedOptions).map((o) => o.value).join(",");
  }

  if (element.type === "file") {
    return element.files && element.files.length > 0 ? element.files[0].name : "";
  }

  return String(element.value == null ? "" : element.value).replace(/\r/g, "");
}

// Like jQuery Validation's default ignore (":hidden"): disabled, type="hidden" and invisible fields are skipped.
function isIgnored(element, elements) {
  if (element.disabled || element.type === "hidden") {
    return true;
  }

  return !elements.some((e) => e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0);
}
