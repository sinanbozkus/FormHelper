const TOKEN_FIELD = "__RequestVerificationToken";
const TOKEN_HEADER = "RequestVerificationToken";

// { url, method, headers, body }; beforeSubmit may change any of them.
export function buildRequest(form, options, submitter) {
  const headers = {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json"
  };

  let url = (submitter && submitter.getAttribute("formaction")) || options.url;
  const method = ((submitter && submitter.getAttribute("formmethod")) || options.method).toUpperCase();
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

  // Browsers without FormData(form, submitter) ignore the clicked button.
  if (submitter && submitter.name && !formData.has(submitter.name)) {
    formData.append(submitter.name, submitter.value);
  }

  return formData;
}

// Builds an object the JSON input formatter can bind:
// - a bool checkbox (value="true") becomes true/false; ASP.NET's hidden "false" input is skipped
// - several checkboxes with the same name and multiple selects become arrays
// - "Address.City" and "Items[0].Name" become nested objects/arrays
// - empty values become null (so nullable numbers bind)
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
  values.forEach(([name]) => (counts[name] = (counts[name] || 0) + 1));

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
  return tokens(name).reduce((current, token) => (current == null ? undefined : current[token]), target);
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
