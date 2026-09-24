import { classList, normalizeFieldName, setText } from "./utils.js";

// Shows and clears validation messages using ASP.NET's markup and css classes:
// <span data-valmsg-for="Title">, input-validation-error, field-validation-error, validation summary.

let describedByCounter = 0;

export function fieldElements(form, name) {
  const key = normalizeFieldName(name).toLowerCase();
  return Array.from(form.elements).filter((e) => e.name && e.name.toLowerCase() === key);
}

export function messageElements(form, name) {
  const key = normalizeFieldName(name).toLowerCase();
  return Array.from(form.querySelectorAll("[data-valmsg-for]"))
    .filter((e) => e.getAttribute("data-valmsg-for").toLowerCase() === key);
}

function replaces(messageElement) {
  return messageElement.getAttribute("data-valmsg-replace") !== "false";
}

// Returns false when the field has no message element, so the caller can show the messages elsewhere.
export function showFieldErrors(form, name, messages, options) {
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

export function clearFieldErrors(form, name, options) {
  fieldElements(form, name).forEach((input) => clearInput(input, options));
  messageElements(form, name).forEach((target) => clearMessage(target, options));
}

export function clearAllErrors(form, options) {
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

// <div asp-validation-summary="All"> renders data-valmsg-summary="true".
// "ModelOnly" summaries are not rendered when there are no errors, so any element with data-fh-summary works too.
export function getSummary(form) {
  return form.querySelector("[data-valmsg-summary=\"true\"], [data-fh-summary]");
}

export function setSummary(form, messages) {
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

export function focusFirstInvalid(form) {
  const invalid = Array.from(form.elements).find((e) => e.getAttribute("aria-invalid") === "true" || e.classList.contains("input-validation-error"));

  if (invalid && typeof invalid.focus === "function") {
    invalid.focus();
  }
}
