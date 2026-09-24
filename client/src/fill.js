import { fieldElements } from "./messages.js";

// Fills the form fields from an object: FormHelper.fill(form, data, callbacks).
// callbacks: { propertyName: function (value) { ... } } handles a property yourself.
// Nested objects fill fields like "Address.City".
export function fillForm(form, data, callbacks, prefix) {
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

    // A bool checkbox comes with ASP.NET's hidden "false" input; only the checkbox is set.
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
    // [Flags] enums arrive as "Read, Write"
    const values = Array.isArray(value) ? value.map(String) : String(value == null ? "" : value).split(/[ ,]+/);
    Array.from(element.options).forEach((option) => (option.selected = values.indexOf(option.value) !== -1));
  } else if (element.type !== "file") {
    element.value = value == null ? "" : value;
  }
}
