import { fillForm } from "./fill.js";
import { clearAllErrors, getSummary, setSummary } from "./messages.js";
import { getFormOptions, globals } from "./options.js";
import { buildRequest } from "./request.js";
import { toastr } from "./toast.js";
import { dispatch, isFormHelperForm, normalizeFieldName, resolveFunction, toForm } from "./utils.js";
import { createBuiltInEngine } from "./validation/builtin.js";
import { createJQueryEngine, hasJQueryValidation } from "./validation/jquery.js";
import { addRule } from "./validation/rules.js";

const engines = {
  builtin: createBuiltInEngine(true),
  none: createBuiltInEngine(false),
  jquery: createJQueryEngine()
};

const busyForms = new WeakSet();

function getEngine(options) {
  const mode = options.validation;

  if (mode === "none" || mode === "builtin") {
    return engines[mode];
  }

  if (hasJQueryValidation()) {
    return engines.jquery;
  }

  if (mode === "jquery") {
    console.warn("FormHelper: validation is set to \"jquery\" but jQuery Validation Unobtrusive was not found; the built-in validator is used.");
  }

  return engines.builtin;
}

const statusTypes = { 1: "success", 2: "info", 3: "warning", 4: "error", success: "success", info: "info", warning: "warning", error: "error" };

function statusType(result) {
  return statusTypes[String(result.status).toLowerCase()] || (isSucceed(result) ? "success" : "error");
}

// Any JSON isn't a FormResult: e.g. ASP.NET's ProblemDetails for an unhandled exception.
function isFormResult(result) {
  return !!result && typeof result === "object" &&
    (typeof result.isSucceed === "boolean" || String(result.status).toLowerCase() in statusTypes);
}

function isSucceed(result) {
  if (typeof result.isSucceed === "boolean") {
    return result.isSucceed;
  }
  const status = String(result.status).toLowerCase();
  return status === "1" || status === "2" || status === "success" || status === "info";
}

function notify(type, message, form, options, toastOptions) {
  if (!message || options.notify === false) {
    return;
  }

  if (typeof options.notify === "function") {
    options.notify({ type, message, form });
    return;
  }

  // On small screens the notifications use the full width.
  const small = window.matchMedia && window.matchMedia("(max-width: 767.98px)").matches;

  toastr[type](message, null, Object.assign({
    positionClass: small ? "formhelper-toast-top-full-width" : options.toastrPosition
  }, toastOptions));
}

function submitButtons(form) {
  return Array.from(form.elements).filter((e) =>
    (e.tagName === "BUTTON" && (e.type || "submit").toLowerCase() === "submit") ||
    (e.tagName === "INPUT" && (e.type === "submit" || e.type === "image")));
}

function lockButtons(form) {
  const locked = submitButtons(form).filter((b) => !b.disabled);
  locked.forEach((b) => (b.disabled = true));
  form.formhelperLockedButtons = locked;
}

function unlockButtons(form) {
  (form.formhelperLockedButtons || []).forEach((b) => (b.disabled = false));
  form.formhelperLockedButtons = [];
}

// The body is read as text once, so it can still be logged when it isn't a FormResult.
async function readResponse(response) {
  const text = await response.text();
  let result = null;

  if ((response.headers.get("Content-Type") || "").indexOf("json") !== -1) {
    try {
      result = JSON.parse(text);
    } catch (e) {
      result = null;
    }
  }

  return { text, result };
}

async function submitForm(form, submitter) {
  if (busyForms.has(form)) {
    return;
  }

  const options = getFormOptions(form);
  const engine = getEngine(options);
  const skipValidation = submitter && submitter.hasAttribute("formnovalidate");

  busyForms.add(form);

  try {
    if (!skipValidation) {
      const valid = await engine.validate(form, options);

      if (!valid) {
        notify("error", options.checkMessage, form, options);
        engine.focusInvalid(form);
        dispatch(form, "invalid", { form });
        return;
      }
    }

    const request = buildRequest(form, options, submitter);

    const beforeSubmit = resolveFunction(options.beforeSubmit);
    if (beforeSubmit && (await beforeSubmit(form, request)) === false) {
      return;
    }

    if (!dispatch(form, "before-submit", { form, request }, true)) {
      return;
    }

    lockButtons(form);

    let response = null;
    let result = null;
    let body = "";

    try {
      response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        credentials: "same-origin"
      });
      ({ text: body, result } = await readResponse(response));
    } catch (error) {
      console.error("FormHelper: the request failed.", error);
    }

    // An action without [FormValidator] redirected (e.g. RedirectToAction): fetch followed the redirect and got the
    // next page, so go there. With [FormValidator] the redirect arrives as a FormResult instead.
    if (!isFormResult(result) && response && response.redirected && response.ok) {
      window.location.replace(response.url);
      return;
    }

    if (!isFormResult(result)) {
      if (response) {
        console.error("FormHelper: unexpected response (" + response.status + ").", body);
      }
      unlockButtons(form);
      notify("error", options.errorMessage, form, options);
      dispatch(form, "error", { form, result: null, response });
      dispatch(form, "complete", { form, result: null, response });
      return;
    }

    handleResult(form, options, engine, result, response);
  } finally {
    busyForms.delete(form);
  }
}

function handleResult(form, options, engine, result, response) {
  // Errors of the previous response go away; e.g. fields without client-side rules keep them otherwise.
  clearAllErrors(form, options);

  const succeed = isSucceed(result);
  const errors = normalizeErrors(result.validationErrors);
  const hasMessage = typeof result.message === "string" && result.message !== "";

  // A message followed by a redirect stays on the screen until the page changes.
  const toastOptions = result.redirectUri ? { timeOut: 0, extendedTimeOut: 0 } : undefined;

  if (hasMessage) {
    notify(statusType(result), result.message, form, options, toastOptions);
  } else if (!succeed) {
    notify("error", options.checkMessage, form, options, toastOptions);
  }

  if (!succeed) {
    unlockButtons(form);
  }

  if (errors.length > 0) {
    // Returns the messages of fields without a message element.
    const unplaced = engine.showErrors(form, errors, options);

    // A validation summary shows every message (like after a full page post). Without one, messages that have
    // no place on the page are shown as a notification. Model-level errors are already the result message.
    if (getSummary(form)) {
      setSummary(form, errors.reduce((all, e) => all.concat(e.messages), []));
    } else if (unplaced.length > 0) {
      notify("error", unplaced.join("\n"), form, options);
    }

    engine.focusInvalid(form);
  }

  const callback = resolveFunction(options.callback);
  if (callback) {
    callback(result, form);
  }

  dispatch(form, succeed ? "success" : "error", { form, result, response });
  dispatch(form, "complete", { form, result, response });

  if (result.redirectUri) {
    const delay = hasMessage ? (result.redirectDelay || options.redirectDelay) : 1;
    setTimeout(() => window.location.replace(result.redirectUri), delay);
  }

  if (succeed) {
    if (options.enableButtonAfterSuccess) {
      unlockButtons(form);
    }

    if (options.resetFormAfterSuccess) {
      resetValues(form);
      engine.clear(form, options);
    }
  }
}

// Accepts FormResult's [{ propertyName, messages }] or { name: message(s) }.
function normalizeErrors(errors) {
  if (!errors) {
    return [];
  }

  const list = Array.isArray(errors)
    ? errors
    : Object.keys(errors).map((key) => ({ propertyName: key, messages: errors[key] }));

  return list.map((e) => {
    const messages = e.messages;
    return {
      propertyName: normalizeFieldName(e.propertyName),
      messages: (Array.isArray(messages) ? messages : [messages]).filter((m) => m != null && m !== "").map(String)
    };
  }).filter((e) => e.messages.length > 0);
}

// Resets the values; the caller clears the messages right away, so onReset doesn't clear them again later
// (that would remove the messages of a validation that runs in between).
function resetValues(form) {
  form.formhelperResetting = true;
  try {
    form.reset();
  } finally {
    form.formhelperResetting = false;
  }
}

function resetForm(form) {
  const options = getFormOptions(form);
  resetValues(form);
  getEngine(options).clear(form, options);
  unlockButtons(form);
  submitButtons(form).forEach((b) => (b.disabled = false));
}

function onSubmit(event) {
  const form = event.target;

  if (!isFormHelperForm(form) || event.defaultPrevented) {
    return;
  }

  event.preventDefault();
  submitForm(form, event.submitter || null);
}

function onFocusOut(event) {
  const element = event.target;
  const form = element && element.form;

  if (!isFormHelperForm(form) || !element.name || element.getAttribute("data-val") !== "true") {
    return;
  }

  const options = getFormOptions(form);
  getEngine(options).validateElement(form, element, options);
}

// Once a field shows an error, it is validated again while typing so the message goes away when fixed.
function onInput(event) {
  const element = event.target;
  const form = element && element.form;

  if (!isFormHelperForm(form) || !element.name) {
    return;
  }

  const options = getFormOptions(form);
  const engine = getEngine(options);

  if (engine.name !== "jquery" && element.getAttribute("aria-invalid") === "true") {
    engine.validateElement(form, element, options);
  }
}

function onReset(event) {
  const form = event.target;

  if (isFormHelperForm(form) && !form.formhelperResetting) {
    const options = getFormOptions(form);
    // after the browser has reset the values
    setTimeout(() => getEngine(options).clear(form, options), 0);
  }
}

let initialized = false;

export const FormHelper = {
  version: __VERSION__,

  init() {
    if (initialized) {
      return;
    }
    initialized = true;

    // Capture phase: runs before other submit handlers of the form (jQuery Validation's handler would stop the
    // event when the form is invalid). One listener serves every form, including forms added later (modals).
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onInput);
    document.addEventListener("reset", onReset);
  },

  // Defaults for all forms, e.g. FormHelper.configure({ notify: false, errorMessage: "..." }).
  // toastr: default options of the notifications, e.g. { toastr: { closeButton: true } }.
  configure(options) {
    const { toastr: toastrOptions, ...rest } = options || {};
    Object.assign(globals, rest);
    if (toastrOptions) {
      Object.assign(toastr.options, toastrOptions);
    }
  },

  submit(target) {
    const form = toForm(target);
    return form ? submitForm(form, null) : Promise.resolve();
  },

  validate(target) {
    const form = toForm(target);
    if (!form) {
      return Promise.resolve(false);
    }
    const options = getFormOptions(form);
    return getEngine(options).validate(form, options);
  },

  reset(target) {
    const form = toForm(target);
    if (form) {
      resetForm(form);
    }
  },

  fill(target, data, callbacks) {
    const form = toForm(target);
    if (form) {
      fillForm(form, data, callbacks);
    }
  },

  // Shows errors in FormResult's format: [{ propertyName, messages }] or { name: "message" }.
  showErrors(target, errors) {
    const form = toForm(target);
    if (!form) {
      return;
    }
    const options = getFormOptions(form);
    const engine = getEngine(options);
    const list = normalizeErrors(errors);
    engine.showErrors(form, list, options);
    setSummary(form, list.reduce((all, e) => all.concat(e.messages), []));
  },

  validation: {
    // FormHelper.validation.addRule("mustbetrue", (value, element, params) => element.checked)
    addRule
  },

  toastr
};
