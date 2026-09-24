// Resolves "save", "app.forms.save" or a function to a function (issue #25: beforeSubmit didn't support dotted names).
export function resolveFunction(name) {
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

export function dispatch(form, name, detail, cancelable) {
  const event = new CustomEvent("formhelper:" + name, {
    bubbles: true,
    cancelable: !!cancelable,
    detail
  });

  return form.dispatchEvent(event);
}

export function classList(value) {
  return value ? String(value).split(/\s+/).filter(Boolean) : [];
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Writes text into an element; each line break becomes a <br>. Never parses html.
export function setText(element, lines) {
  element.textContent = "";

  const list = Array.isArray(lines) ? lines : String(lines).split(/\r?\n/);

  list.forEach((line, index) => {
    if (index > 0) {
      element.appendChild(document.createElement("br"));
    }
    element.appendChild(document.createTextNode(line));
  });
}

export function toForm(target) {
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

export function isFormHelperForm(form) {
  return !!form && form.tagName === "FORM" && form.hasAttribute("data-formhelper");
}

// ModelState keys of a JSON body can start with "$." (e.g. "$.title").
export function normalizeFieldName(name) {
  return String(name || "").replace(/^\$\.?/, "");
}
