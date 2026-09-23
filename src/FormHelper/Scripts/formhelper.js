/*! FormHelper v6.0.0 | MIT License | https://github.com/sinanbozkus/FormHelper */
(() => {
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

  // src/utils.js
  function resolveFunction(name) {
    if (typeof name === "function") {
      return name;
    }
    if (!name) {
      return null;
    }
    let target = window;
    for (const part of String(name).split(".")) {
      if (target == null) {
        return null;
      }
      target = target[part];
    }
    return typeof target === "function" ? target : null;
  }
  function dispatch(form, name, detail, cancelable) {
    const event = new CustomEvent("formhelper:" + name, {
      bubbles: true,
      cancelable: !!cancelable,
      detail
    });
    return form.dispatchEvent(event);
  }
  function classList(value) {
    return value ? String(value).split(/\s+/).filter(Boolean) : [];
  }
  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function setText(element, lines) {
    element.textContent = "";
    const list = Array.isArray(lines) ? lines : String(lines).split(/\r?\n/);
    list.forEach((line, index) => {
      if (index > 0) {
        element.appendChild(document.createElement("br"));
      }
      element.appendChild(document.createTextNode(line));
    });
  }
  function toForm(target) {
    if (!target) {
      return null;
    }
    if (typeof target === "string") {
      target = document.querySelector(target);
    } else if (target.jquery) {
      target = target[0];
    }
    if (target && target.tagName !== "FORM" && target.form) {
      target = target.form;
    }
    return target && target.tagName === "FORM" ? target : null;
  }
  function isFormHelperForm(form) {
    return !!form && form.tagName === "FORM" && form.hasAttribute("data-formhelper");
  }
  function normalizeFieldName(name) {
    return String(name || "").replace(/^\$\.?/, "");
  }

  // src/messages.js
  var describedByCounter = 0;
  function fieldElements(form, name) {
    const key = normalizeFieldName(name).toLowerCase();
    return Array.from(form.elements).filter((e) => e.name && e.name.toLowerCase() === key);
  }
  function messageElements(form, name) {
    const key = normalizeFieldName(name).toLowerCase();
    return Array.from(form.querySelectorAll("[data-valmsg-for]")).filter((e) => e.getAttribute("data-valmsg-for").toLowerCase() === key);
  }
  function replaces(messageElement) {
    return messageElement.getAttribute("data-valmsg-replace") !== "false";
  }
  function showFieldErrors(form, name, messages, options) {
    const inputs = fieldElements(form, name);
    const targets = messageElements(form, name);
    inputs.forEach((input) => {
      input.classList.remove("input-validation-valid");
      input.classList.add("input-validation-error", ...classList(options.inputErrorClass));
      input.setAttribute("aria-invalid", "true");
    });
    targets.forEach((target) => {
      target.classList.remove("field-validation-valid");
      target.classList.add("field-validation-error", ...classList(options.messageErrorClass));
      if (replaces(target)) {
        setText(target, messages);
      }
      if (!target.id) {
        target.id = "formhelper-message-" + ++describedByCounter;
      }
      inputs.forEach((input) => {
        const describedBy = classList(input.getAttribute("aria-describedby"));
        if (describedBy.indexOf(target.id) === -1) {
          input.setAttribute("aria-describedby", describedBy.concat(target.id).join(" "));
        }
      });
    });
    return targets.length > 0;
  }
  function clearFieldErrors(form, name, options) {
    fieldElements(form, name).forEach((input) => clearInput(input, options));
    messageElements(form, name).forEach((target) => clearMessage(target, options));
  }
  function clearAllErrors(form, options) {
    Array.from(form.elements).forEach((input) => clearInput(input, options));
    Array.from(form.querySelectorAll("[data-valmsg-for]")).forEach((target) => clearMessage(target, options));
    setSummary(form, []);
  }
  function clearInput(input, options) {
    if (input.classList.contains("input-validation-error")) {
      input.classList.remove("input-validation-error", ...classList(options.inputErrorClass));
      input.classList.add("input-validation-valid");
    }
    input.removeAttribute("aria-invalid");
  }
  function clearMessage(target, options) {
    target.classList.remove("field-validation-error", ...classList(options.messageErrorClass));
    target.classList.add("field-validation-valid");
    if (replaces(target)) {
      target.textContent = "";
    }
  }
  function getSummary(form) {
    return form.querySelector('[data-valmsg-summary="true"], [data-fh-summary]');
  }
  function setSummary(form, messages) {
    const summary = getSummary(form);
    if (!summary) {
      return false;
    }
    let list = summary.querySelector("ul");
    if (!list) {
      list = document.createElement("ul");
      summary.appendChild(list);
    }
    list.textContent = "";
    messages.forEach((message) => {
      const item = document.createElement("li");
      setText(item, message);
      list.appendChild(item);
    });
    summary.classList.toggle("validation-summary-errors", messages.length > 0);
    summary.classList.toggle("validation-summary-valid", messages.length === 0);
    return true;
  }
  function focusFirstInvalid(form) {
    const invalid = Array.from(form.elements).find((e) => e.getAttribute("aria-invalid") === "true" || e.classList.contains("input-validation-error"));
    if (invalid && typeof invalid.focus === "function") {
      invalid.focus();
    }
  }

  // src/fill.js
  function fillForm(form, data, callbacks, prefix) {
    if (!data) {
      return;
    }
    Object.keys(data).forEach((key) => {
      const value = data[key];
      const name = (prefix || "") + key;
      if (callbacks && typeof callbacks[name] === "function") {
        callbacks[name](value);
        return;
      }
      const all = fieldElements(form, name);
      const elements = all.length > 1 ? all.filter((e) => e.type !== "hidden") : all;
      if (elements.length === 0) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          fillForm(form, value, callbacks, name + ".");
        }
        return;
      }
      elements.forEach((element) => setValue(element, value));
    });
  }
  function setValue(element, value) {
    if (element.type === "checkbox") {
      if (Array.isArray(value)) {
        element.checked = value.map(String).indexOf(element.value) !== -1;
      } else {
        element.checked = value === true || value === "true" || value === "True" || value === 1 || value === "1";
      }
    } else if (element.type === "radio") {
      element.checked = value != null && String(value) === element.value;
    } else if (element.tagName === "SELECT" && element.multiple) {
      const values = Array.isArray(value) ? value.map(String) : String(value == null ? "" : value).split(/[ ,]+/);
      Array.from(element.options).forEach((option) => option.selected = values.indexOf(option.value) !== -1);
    } else if (element.type !== "file") {
      element.value = value == null ? "" : value;
    }
  }

  // src/options.js
  var globals = {
    dataType: "formdata",
    redirectDelay: 1500,
    toastrPosition: "formhelper-toast-top-right",
    enableButtonAfterSuccess: false,
    resetFormAfterSuccess: true,
    checkMessage: "Check the form fields.",
    // Shown when the response is not a FormResult (e.g. a 500 error page). The details go to the console.
    // Forms rendered by the tag helper carry FormHelperOptions.ErrorMessage instead.
    errorMessage: "An error occurred. Please try again.",
    validation: "auto",
    inputErrorClass: "",
    messageErrorClass: "",
    callback: null,
    beforeSubmit: null,
    // undefined: fhToastr, false: no notifications, function({ type, message, form }): your own notifications.
    notify: void 0
  };
  function getFormOptions(form) {
    const data = form.dataset;
    const bool = (value, fallback) => value == null ? fallback : value.toLowerCase() === "true";
    const text = (value, fallback) => value == null || value === "" ? fallback : value;
    const redirectDelay = parseInt(data.fhRedirectDelay, 10);
    return {
      url: form.getAttribute("action") || window.location.href,
      method: (form.getAttribute("method") || "post").toUpperCase(),
      dataType: text(data.fhDataType, globals.dataType).toLowerCase(),
      redirectDelay: isNaN(redirectDelay) ? globals.redirectDelay : redirectDelay,
      toastrPosition: text(data.fhToastrPosition, globals.toastrPosition),
      enableButtonAfterSuccess: bool(data.fhEnableButtonAfterSuccess, globals.enableButtonAfterSuccess),
      resetFormAfterSuccess: bool(data.fhResetFormAfterSuccess, globals.resetFormAfterSuccess),
      checkMessage: text(data.fhCheckMessage, globals.checkMessage),
      errorMessage: text(data.fhErrorMessage, globals.errorMessage),
      validation: text(data.fhValidation, globals.validation).toLowerCase(),
      inputErrorClass: text(data.fhInputErrorClass, globals.inputErrorClass),
      messageErrorClass: text(data.fhMessageErrorClass, globals.messageErrorClass),
      callback: text(data.fhCallback, globals.callback),
      beforeSubmit: text(data.fhBeforeSubmit, globals.beforeSubmit),
      notify: globals.notify
    };
  }

  // src/request.js
  var TOKEN_FIELD = "__RequestVerificationToken";
  var TOKEN_HEADER = "RequestVerificationToken";
  function buildRequest(form, options, submitter) {
    const headers = {
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "application/json"
    };
    let url = submitter && submitter.getAttribute("formaction") || options.url;
    const method = (submitter && submitter.getAttribute("formmethod") || options.method).toUpperCase();
    let body;
    if (method === "GET") {
      const query = new URLSearchParams();
      toFormData(form, submitter).forEach((value, key) => {
        if (typeof value === "string") {
          query.append(key, value);
        }
      });
      url += (url.indexOf("?") === -1 ? "?" : "&") + query.toString();
    } else if (options.dataType === "json") {
      const { data, token } = toJson(form, submitter);
      if (token) {
        headers[TOKEN_HEADER] = token;
      }
      headers["Content-Type"] = "application/json; charset=utf-8";
      body = JSON.stringify(data);
    } else {
      body = toFormData(form, submitter);
    }
    return { url, method, headers, body };
  }
  function toFormData(form, submitter) {
    let formData;
    try {
      formData = submitter ? new FormData(form, submitter) : new FormData(form);
    } catch (e) {
      formData = new FormData(form);
    }
    if (submitter && submitter.name && !formData.has(submitter.name)) {
      formData.append(submitter.name, submitter.value);
    }
    return formData;
  }
  function toJson(form, submitter) {
    const elements = Array.from(form.elements).filter((e) => e.name && !e.disabled);
    const checkboxes = {};
    elements.forEach((e) => {
      if (e.type === "checkbox") {
        checkboxes[e.name] = (checkboxes[e.name] || 0) + 1;
      }
    });
    const values = [];
    let token = null;
    elements.forEach((element) => {
      const { name, type } = element;
      if (name === TOKEN_FIELD) {
        token = element.value;
        return;
      }
      if (type === "file" || type === "submit" || type === "button" || type === "reset" || type === "image") {
        return;
      }
      if (type === "hidden" && checkboxes[name]) {
        return;
      }
      if (type === "checkbox") {
        if (checkboxes[name] === 1 && element.value.toLowerCase() === "true") {
          values.push([name, element.checked, false]);
        } else if (element.checked) {
          values.push([name, element.value, checkboxes[name] > 1]);
        }
        return;
      }
      if (type === "radio") {
        if (element.checked) {
          values.push([name, element.value, false]);
        }
        return;
      }
      if (element.tagName === "SELECT" && element.multiple) {
        values.push([name, Array.from(element.selectedOptions).map((o) => o.value), false]);
        return;
      }
      values.push([name, element.value === "" ? null : element.value, false]);
    });
    if (submitter && submitter.name) {
      values.push([submitter.name, submitter.value, false]);
    }
    const data = {};
    const counts = {};
    values.forEach(([name]) => counts[name] = (counts[name] || 0) + 1);
    values.forEach(([name, value, asArray]) => {
      if (asArray || counts[name] > 1) {
        const current = getPath(data, name);
        setPath(data, name, Array.isArray(current) ? current.concat(value) : [value]);
      } else {
        setPath(data, name, value);
      }
    });
    return { data, token };
  }
  function tokens(name) {
    return name.replace(/\[(\d*)\]/g, ".$1").split(".").filter((t) => t !== "");
  }
  function getPath(target, name) {
    return tokens(name).reduce((current, token) => current == null ? void 0 : current[token], target);
  }
  function setPath(target, name, value) {
    const parts = tokens(name);
    let current = target;
    if (parts.some((p) => p === "__proto__" || p === "constructor" || p === "prototype")) {
      return;
    }
    parts.forEach((token, index) => {
      if (index === parts.length - 1) {
        current[token] = value;
        return;
      }
      if (current[token] == null || typeof current[token] !== "object") {
        current[token] = /^\d+$/.test(parts[index + 1]) ? [] : {};
      }
      current = current[token];
    });
  }

  // src/toast.js
  var defaults = {
    containerId: "formhelper-toast-container",
    target: "body",
    toastClass: "formhelper-toast",
    titleClass: "formhelper-toast-title",
    messageClass: "formhelper-toast-message",
    closeClass: "formhelper-toast-close-button",
    progressClass: "formhelper-toast-progress",
    positionClass: "formhelper-toast-top-right",
    iconClasses: {
      error: "formhelper-toast-error",
      info: "formhelper-toast-info",
      success: "formhelper-toast-success",
      warning: "formhelper-toast-warning"
    },
    timeOut: 5e3,
    // set timeOut and extendedTimeOut to 0 to make it sticky
    extendedTimeOut: 1e3,
    showDuration: 300,
    hideDuration: 1e3,
    closeButton: false,
    closeHtml: '<button type="button">&times;</button>',
    progressBar: false,
    preventDuplicates: false,
    newestOnTop: true,
    tapToDismiss: true,
    closeOnHover: true,
    // true: message and title are shown as text. Set false to show html you trust (never user input).
    escapeHtml: true,
    rtl: false,
    onclick: null,
    onShown: null,
    onHidden: null,
    onCloseClick: null
  };
  var HIDDEN_CLASS = "formhelper-toast-hidden";
  var previousMessage;
  var toastr = {
    version: "6.0.0",
    options: {},
    success: (message, title, options) => notify("success", message, title, options),
    info: (message, title, options) => notify("info", message, title, options),
    warning: (message, title, options) => notify("warning", message, title, options),
    error: (message, title, options) => notify("error", message, title, options),
    clear,
    remove
  };
  function getOptions(override) {
    const options = Object.assign({}, defaults, toastr.options, override);
    options.iconClasses = Object.assign({}, defaults.iconClasses, toastr.options.iconClasses, override && override.iconClasses);
    return options;
  }
  function getContainer(options, create) {
    let container = document.getElementById(options.containerId);
    if (!container && create) {
      container = document.createElement("div");
      container.id = options.containerId;
      (document.querySelector(options.target) || document.body).appendChild(container);
    }
    return container;
  }
  function setContent(element, value, escape) {
    if (escape) {
      setText(element, String(value));
    } else {
      element.innerHTML = value;
    }
  }
  function notify(type, message, title, override) {
    const options = getOptions(override);
    if (options.preventDuplicates) {
      if (message === previousMessage) {
        return null;
      }
      previousMessage = message;
    }
    const container = getContainer(options, true);
    container.className = options.positionClass;
    const toast = document.createElement("div");
    toast.className = options.toastClass + " " + options.iconClasses[type];
    toast.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
    toast.setAttribute("aria-live", type === "error" || type === "warning" ? "assertive" : "polite");
    if (options.rtl) {
      toast.classList.add("rtl");
    }
    let progress = null;
    if (options.progressBar) {
      progress = document.createElement("div");
      progress.className = options.progressClass;
      toast.appendChild(progress);
    }
    if (options.closeButton) {
      const template = document.createElement("template");
      template.innerHTML = options.closeHtml.trim();
      const close = template.content.firstElementChild;
      close.classList.add(options.closeClass);
      close.setAttribute("role", "button");
      close.setAttribute("aria-label", "Close");
      close.addEventListener("click", (event) => {
        event.stopPropagation();
        if (options.onCloseClick) {
          options.onCloseClick(event);
        }
        hide(true);
      });
      toast.insertBefore(close, toast.firstChild);
    }
    if (title) {
      const titleElement = document.createElement("div");
      titleElement.className = options.titleClass;
      setContent(titleElement, title, options.escapeHtml);
      toast.appendChild(titleElement);
    }
    if (message) {
      const messageElement = document.createElement("div");
      messageElement.className = options.messageClass;
      setContent(messageElement, message, options.escapeHtml);
      toast.appendChild(messageElement);
    }
    if (options.newestOnTop) {
      container.insertBefore(toast, container.firstChild);
    } else {
      container.appendChild(toast);
    }
    toast.classList.add(HIDDEN_CLASS);
    toast.style.transitionDuration = options.showDuration + "ms";
    void toast.offsetWidth;
    toast.classList.remove(HIDDEN_CLASS);
    if (options.onShown) {
      setTimeout(options.onShown, options.showDuration);
    }
    let hideTimer = null;
    let progressTimer = null;
    let hideEta = 0;
    let maxHideTime = 0;
    let hidden = false;
    function startTimer(duration) {
      if (duration > 0) {
        hideTimer = setTimeout(() => hide(false), duration);
        maxHideTime = duration;
        hideEta = Date.now() + duration;
        if (progress && !progressTimer) {
          progressTimer = setInterval(() => {
            const percentage = Math.max(0, (hideEta - Date.now()) / maxHideTime * 100);
            progress.style.width = percentage + "%";
          }, 10);
        }
      }
    }
    function hide(override2) {
      if (hidden || !override2 && toast.contains(document.activeElement)) {
        return;
      }
      hidden = true;
      clearTimeout(hideTimer);
      clearInterval(progressTimer);
      toast.style.transitionDuration = options.hideDuration + "ms";
      toast.classList.add(HIDDEN_CLASS);
      setTimeout(() => {
        removeToast(toast);
        if (options.onHidden) {
          options.onHidden();
        }
      }, options.hideDuration);
    }
    if (options.closeOnHover) {
      toast.addEventListener("mouseenter", () => {
        if (hidden) {
          return;
        }
        clearTimeout(hideTimer);
        hideEta = 0;
      });
      toast.addEventListener("mouseleave", () => {
        if (!hidden && (options.timeOut > 0 || options.extendedTimeOut > 0)) {
          startTimer(options.extendedTimeOut);
        }
      });
    }
    if (options.onclick) {
      toast.addEventListener("click", (event) => {
        options.onclick(event);
        hide(false);
      });
    } else if (options.tapToDismiss) {
      toast.addEventListener("click", () => hide(false));
    }
    startTimer(options.timeOut);
    toast.formhelperHide = hide;
    return toast;
  }
  function removeToast(toast) {
    const container = toast.parentNode;
    if (container) {
      container.removeChild(toast);
      if (container.children.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
        previousMessage = void 0;
      }
    }
  }
  function clear(toast) {
    const toasts = toast ? [toast.jquery ? toast[0] : toast] : currentToasts();
    toasts.forEach((t) => t && t.formhelperHide ? t.formhelperHide(true) : t && removeToast(t));
  }
  function remove(toast) {
    const toasts = toast ? [toast.jquery ? toast[0] : toast] : currentToasts();
    toasts.forEach((t) => t && removeToast(t));
  }
  function currentToasts() {
    const container = getContainer(getOptions(), false);
    return container ? Array.from(container.children) : [];
  }

  // src/validation/rules.js
  var rules = /* @__PURE__ */ Object.create(null);
  function addRule(name, validate) {
    rules[String(name).toLowerCase()] = validate;
  }
  function toNumber(value) {
    return value === "" || value == null ? NaN : Number(String(value).trim().replace(",", "."));
  }
  function lengthOf(value, element, form) {
    if (element.tagName === "SELECT") {
      return Array.from(element.options).filter((o) => o.selected).length;
    }
    if (element.type === "checkbox" || element.type === "radio") {
      return fieldElements(form, element.name).filter((e) => e.checked).length;
    }
    return value.length;
  }
  addRule("required", (value) => value.trim() !== "");
  addRule("length", (value, element, params, form) => {
    const length = lengthOf(value, element, form);
    return (!params.min || length >= Number(params.min)) && (!params.max || length <= Number(params.max));
  });
  addRule("minlength", (value, element, params, form) => lengthOf(value, element, form) >= Number(params.min));
  addRule("maxlength", (value, element, params, form) => lengthOf(value, element, form) <= Number(params.max));
  addRule("range", (value, element, params) => {
    const number = toNumber(value);
    if (isNaN(number)) {
      return false;
    }
    const min = toNumber(params.min);
    const max = toNumber(params.max);
    return (isNaN(min) || number >= min) && (isNaN(max) || number <= max);
  });
  addRule("number", (value) => /^[-+]?(\d+([.,]\d*)?|[.,]\d+)$/.test(value.trim()));
  addRule("regex", (value, element, params) => {
    let expression;
    try {
      expression = new RegExp(params.pattern);
    } catch (e) {
      console.warn("FormHelper: the pattern of " + element.name + " is not valid in JavaScript; it is validated on the server only.", e);
      return true;
    }
    const match = expression.exec(value);
    return !!match && match.index === 0 && match[0].length === value.length;
  });
  addRule("email", (value) => /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value));
  addRule("url", (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "ftp:";
    } catch (e) {
      return false;
    }
  });
  addRule("phone", (value) => {
    const number = value.trim().replace(/\s*(x|ext\.?|extension)\s*\d+$/i, "");
    return /^\+?[\d\s().-]+$/.test(number) && /\d/.test(number);
  });
  addRule("creditcard", (value) => {
    if (/[^0-9 \-]+/.test(value)) {
      return false;
    }
    const digits = value.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      return false;
    }
    let sum = 0;
    let even = false;
    for (let n = digits.length - 1; n >= 0; n--) {
      let digit = parseInt(digits.charAt(n), 10);
      if (even && (digit *= 2) > 9) {
        digit -= 9;
      }
      sum += digit;
      even = !even;
    }
    return sum % 10 === 0;
  });
  addRule("equalto", (value, element, params, form) => {
    let other = params.other || "";
    if (other.indexOf("*.") === 0) {
      const name = element.name;
      const prefix = name.substr(0, name.lastIndexOf(".") + 1);
      other = prefix + other.substr(2);
    }
    const target = fieldElements(form, other)[0];
    return !target || target.value === value;
  });
  var remoteRequests = /* @__PURE__ */ new WeakMap();
  addRule("remote", (value, element, params, form) => {
    if (!params.url) {
      return true;
    }
    const method = (params.type || "GET").toUpperCase();
    const prefix = element.name.substr(0, element.name.lastIndexOf(".") + 1);
    const data = new URLSearchParams();
    String(params.additionalfields || element.name).split(",").map((field) => field.trim()).filter(Boolean).map((field) => field.indexOf("*.") === 0 ? prefix + field.substr(2) : field).forEach((field) => data.append(field, remoteFieldValue(form, field)));
    const key = method + " " + params.url + "?" + data.toString();
    const previous = remoteRequests.get(element);
    if (previous && previous.key === key) {
      return previous.promise;
    }
    const headers = { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" };
    let request;
    if (method === "GET") {
      request = fetch(params.url + (params.url.indexOf("?") === -1 ? "?" : "&") + data.toString(), { headers, credentials: "same-origin" });
    } else {
      const token = form.querySelector('input[name="__RequestVerificationToken"]');
      if (token) {
        headers["RequestVerificationToken"] = token.value;
      }
      headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
      request = fetch(params.url, { method, headers, body: data, credentials: "same-origin" });
    }
    const promise = request.then((response) => {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    }).then((result) => {
      if (result === true || result === "true") {
        return true;
      }
      return typeof result === "string" && result !== "" ? result : false;
    }).catch((error) => {
      console.warn("FormHelper: remote validation failed (" + params.url + ").", error);
      remoteRequests.delete(element);
      return true;
    });
    remoteRequests.set(element, { key, promise });
    return promise;
  });
  function remoteFieldValue(form, name) {
    const elements = fieldElements(form, name);
    const first = elements[0];
    if (!first) {
      return "";
    }
    if (first.type === "checkbox" || first.type === "radio") {
      const checked = elements.find((e) => (e.type === "checkbox" || e.type === "radio") && e.checked);
      const hidden = elements.find((e) => e.type === "hidden");
      return checked ? checked.value : hidden ? hidden.value : "";
    }
    return first.value;
  }
  addRule("fileextensions", (value, element, params) => {
    const allowed = String(params.extensions || "png,jpg,jpeg,gif").split(",").map((e) => e.trim().replace(/^\./, "").toLowerCase()).filter(Boolean);
    const names = element.files && element.files.length > 0 ? Array.from(element.files).map((f) => f.name) : [value];
    return names.every((name) => allowed.indexOf(name.split(".").pop().toLowerCase()) !== -1);
  });

  // src/validation/builtin.js
  function createBuiltInEngine(clientRules) {
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
        return await validateField(form, element.name, options) === true;
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
  async function validateField(form, name, options) {
    const elements = fieldElements(form, name);
    const element = elements.find((e) => e.getAttribute("data-val") === "true");
    if (!element || isIgnored(element, elements)) {
      return true;
    }
    const value = getValue(elements);
    for (const rule of getRules(element)) {
      const validate = rules[rule.name];
      if (!validate || value === "" && rule.name !== "required" && rule.name !== "equalto") {
        continue;
      }
      let result = validate(value, element, rule.params, form);
      if (result && typeof result.then === "function") {
        result = await result;
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
  function getRules(element) {
    const list = [];
    const attributes = Array.from(element.attributes);
    attributes.forEach((attribute) => {
      const match = /^data-val-([a-z0-9]+)$/i.exec(attribute.name);
      if (!match) {
        return;
      }
      const name = match[1].toLowerCase();
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
  function isIgnored(element, elements) {
    if (element.disabled || element.type === "hidden") {
      return true;
    }
    return !elements.some((e) => e.offsetWidth > 0 || e.offsetHeight > 0 || e.getClientRects().length > 0);
  }

  // src/validation/jquery.js
  function hasJQueryValidation() {
    const $ = window.jQuery;
    return !!($ && $.validator && $.validator.unobtrusive);
  }
  function createJQueryEngine() {
    return {
      name: "jquery",
      async validate(form, options) {
        const $form = window.jQuery(form);
        const validator = getValidator(form, options);
        let valid = $form.valid();
        if (validator && validator.pendingRequest > 0) {
          await waitFor(() => validator.pendingRequest === 0, 3e4);
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
  function addNewFields(form, validator) {
    const $ = window.jQuery;
    const settings = validator.settings;
    settings.rules = settings.rules || {};
    settings.messages = settings.messages || {};
    form.querySelectorAll('[data-val="true"]').forEach((element) => {
      if (!element.name || Object.prototype.hasOwnProperty.call(settings.rules, element.name)) {
        return;
      }
      $.validator.unobtrusive.parseElement(element, true);
      const info = $(form).data("unobtrusiveValidation");
      settings.rules[element.name] = info && info.options.rules[element.name] || {};
      settings.messages[element.name] = info && info.options.messages[element.name] || {};
    });
  }
  function protectJQueryValidation() {
    const $ = window.jQuery;
    if (!$ || !$.validator) {
      return;
    }
    guardRegexMethod();
    if (!$.validator.formhelperRemoteEscaped) {
      $.validator.formhelperRemoteEscaped = true;
      escapeRemoteMessages($);
    }
  }
  function escapeRemoteMessages($) {
    $.ajaxPrefilter((options) => {
      if (typeof options.port !== "string" || options.port.indexOf("validate") !== 0) {
        return;
      }
      const dataFilter = options.dataFilter;
      options.dataFilter = function(data, type) {
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
  function guardRegexMethod() {
    const methods = window.jQuery.validator.methods;
    const regex = methods.regex;
    if (!regex || regex.formhelperGuarded) {
      return;
    }
    methods.regex = function(value, element, params) {
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
  function addCssClassHooks(form, validator, options) {
    const settings = validator.settings;
    const highlight = settings.highlight;
    const unhighlight = settings.unhighlight;
    settings.highlight = function(element, errorClass, validClass) {
      if (highlight) {
        highlight.call(this, element, errorClass, validClass);
      }
      element.classList.add(...classList(options.inputErrorClass));
      messageElements(form, element.name).forEach((m) => m.classList.add(...classList(options.messageErrorClass)));
    };
    settings.unhighlight = function(element, errorClass, validClass) {
      if (unhighlight) {
        unhighlight.call(this, element, errorClass, validClass);
      }
      element.classList.remove(...classList(options.inputErrorClass));
      messageElements(form, element.name).forEach((m) => m.classList.remove(...classList(options.messageErrorClass)));
    };
  }

  // src/core.js
  var engines = {
    builtin: createBuiltInEngine(true),
    none: createBuiltInEngine(false),
    jquery: createJQueryEngine()
  };
  var busyForms = /* @__PURE__ */ new WeakSet();
  function getEngine(options) {
    const mode = options.validation;
    if (mode === "none" || mode === "builtin") {
      return engines[mode];
    }
    if (hasJQueryValidation()) {
      return engines.jquery;
    }
    if (mode === "jquery") {
      console.warn('FormHelper: validation is set to "jquery" but jQuery Validation Unobtrusive was not found; the built-in validator is used.');
    }
    return engines.builtin;
  }
  var statusTypes = { 1: "success", 2: "info", 3: "warning", 4: "error", success: "success", info: "info", warning: "warning", error: "error" };
  function statusType(result) {
    return statusTypes[String(result.status).toLowerCase()] || (isSucceed(result) ? "success" : "error");
  }
  function isFormResult(result) {
    return !!result && typeof result === "object" && (typeof result.isSucceed === "boolean" || String(result.status).toLowerCase() in statusTypes);
  }
  function isSucceed(result) {
    if (typeof result.isSucceed === "boolean") {
      return result.isSucceed;
    }
    const status = String(result.status).toLowerCase();
    return status === "1" || status === "2" || status === "success" || status === "info";
  }
  function notify2(type, message, form, options, toastOptions) {
    if (!message || options.notify === false) {
      return;
    }
    if (typeof options.notify === "function") {
      options.notify({ type, message, form });
      return;
    }
    const small = window.matchMedia && window.matchMedia("(max-width: 767.98px)").matches;
    toastr[type](message, null, Object.assign({
      positionClass: small ? "formhelper-toast-top-full-width" : options.toastrPosition
    }, toastOptions));
  }
  function submitButtons(form) {
    return Array.from(form.elements).filter((e) => e.tagName === "BUTTON" && (e.type || "submit").toLowerCase() === "submit" || e.tagName === "INPUT" && (e.type === "submit" || e.type === "image"));
  }
  function lockButtons(form) {
    const locked = submitButtons(form).filter((b) => !b.disabled);
    locked.forEach((b) => b.disabled = true);
    form.formhelperLockedButtons = locked;
  }
  function unlockButtons(form) {
    (form.formhelperLockedButtons || []).forEach((b) => b.disabled = false);
    form.formhelperLockedButtons = [];
  }
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
          notify2("error", options.checkMessage, form, options);
          engine.focusInvalid(form);
          dispatch(form, "invalid", { form });
          return;
        }
      }
      const request = buildRequest(form, options, submitter);
      const beforeSubmit = resolveFunction(options.beforeSubmit);
      if (beforeSubmit && await beforeSubmit(form, request) === false) {
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
      if (!isFormResult(result) && response && response.redirected && response.ok) {
        window.location.replace(response.url);
        return;
      }
      if (!isFormResult(result)) {
        if (response) {
          console.error("FormHelper: unexpected response (" + response.status + ").", body);
        }
        unlockButtons(form);
        notify2("error", options.errorMessage, form, options);
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
    clearAllErrors(form, options);
    const succeed = isSucceed(result);
    const errors = normalizeErrors(result.validationErrors);
    const hasMessage = typeof result.message === "string" && result.message !== "";
    const toastOptions = result.redirectUri ? { timeOut: 0, extendedTimeOut: 0 } : void 0;
    if (hasMessage) {
      notify2(statusType(result), result.message, form, options, toastOptions);
    } else if (!succeed) {
      notify2("error", options.checkMessage, form, options, toastOptions);
    }
    if (!succeed) {
      unlockButtons(form);
    }
    if (errors.length > 0) {
      const unplaced = engine.showErrors(form, errors, options);
      if (getSummary(form)) {
        setSummary(form, errors.reduce((all, e) => all.concat(e.messages), []));
      } else if (unplaced.length > 0) {
        notify2("error", unplaced.join("\n"), form, options);
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
      const delay = hasMessage ? result.redirectDelay || options.redirectDelay : 1;
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
  function normalizeErrors(errors) {
    if (!errors) {
      return [];
    }
    const list = Array.isArray(errors) ? errors : Object.keys(errors).map((key) => ({ propertyName: key, messages: errors[key] }));
    return list.map((e) => {
      const messages = e.messages;
      return {
        propertyName: normalizeFieldName(e.propertyName),
        messages: (Array.isArray(messages) ? messages : [messages]).filter((m) => m != null && m !== "").map(String)
      };
    }).filter((e) => e.messages.length > 0);
  }
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
    submitButtons(form).forEach((b) => b.disabled = false);
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
      setTimeout(() => getEngine(options).clear(form, options), 0);
    }
  }
  var initialized = false;
  var FormHelper = {
    version: "6.0.0",
    init() {
      if (initialized) {
        return;
      }
      initialized = true;
      document.addEventListener("submit", onSubmit, true);
      document.addEventListener("focusout", onFocusOut);
      document.addEventListener("input", onInput);
      document.addEventListener("change", onInput);
      document.addEventListener("reset", onReset);
    },
    // Defaults for all forms, e.g. FormHelper.configure({ notify: false, errorMessage: "..." }).
    // toastr: default options of the notifications, e.g. { toastr: { closeButton: true } }.
    configure(options) {
      const _a = options || {}, { toastr: toastrOptions } = _a, rest = __objRest(_a, ["toastr"]);
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

  // src/index.js
  function registerJQuery() {
    const $ = window.jQuery;
    if (!$ || !$.fn) {
      return;
    }
    if (!$.parseJSON) {
      $.parseJSON = JSON.parse;
    }
    protectJQueryValidation();
    if ($.formhelperRegistered) {
      return;
    }
    $.formhelperRegistered = true;
    $(document).on("submit.formhelper", "form[data-formhelper]", function(event) {
      if (event.originalEvent) {
        return;
      }
      event.preventDefault();
      window.FormHelper.submit(this);
    });
  }
  if (!window.FormHelper) {
    window.FormHelper = FormHelper;
    window.fhToastr = toastr;
    FormHelper.init();
    document.addEventListener("DOMContentLoaded", registerJQuery);
    window.addEventListener("load", registerJQuery);
  }
  registerJQuery();
})();
