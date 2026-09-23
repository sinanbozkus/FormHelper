// The sample's pages: jQuery (bundle), html helper, without jQuery (built-in validator) and Razor Pages.

// Page helpers, available as __t in the evaluated code.
const helpers = `
window.__t = {
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  async until(condition, timeout) {
    const end = Date.now() + (timeout || 5000);
    while (!condition() && Date.now() < end) {
      await this.sleep(50);
    }
  },
  form: (selector) => document.querySelector(selector || "form[data-formhelper]"),
  input: (form, name) => Array.from(form.elements).find((e) => e.name === name && e.type !== "hidden"),
  msg: (form, name) => { const s = form.querySelector('[data-valmsg-for="' + name + '"]'); return s ? s.textContent : null; },
  toasts: () => Array.from(document.querySelectorAll("#formhelper-toast-container > div")).map((t) => ({ cls: t.className, text: t.textContent })),
  set(form, name, value) {
    Array.from(form.elements).filter((e) => e.name === name && e.type !== "hidden").forEach((e) => {
      if (e.type === "checkbox") e.checked = !!value;
      else if (e.type === "radio") e.checked = e.value === value;
      else e.value = value;
      e.dispatchEvent(new Event("input", { bubbles: true }));
      e.dispatchEvent(new Event("change", { bubbles: true }));
    });
  },
  blur(form, name) {
    const e = this.input(form, name);
    if (window.jQuery) jQuery(e).trigger("focusout");
    e.dispatchEvent(new Event("focusout", { bubbles: true }));
  },
  // Clicks the submit button and waits until FormHelper has finished (formhelper:complete or formhelper:invalid).
  async submit(form) {
    fhToastr.remove();
    const done = new Promise((resolve) => {
      const names = ["formhelper:complete", "formhelper:invalid"];
      const handler = (e) => { names.forEach((n) => form.removeEventListener(n, handler)); resolve(e.type); };
      names.forEach((n) => form.addEventListener(n, handler));
      setTimeout(() => resolve("timeout"), 8000);
    });
    form.querySelector("button[type=submit]").click();
    const result = await done;
    await this.sleep(100);
    return result;
  }
};`;

export default async function (browser, base, check) {
  // ------------------------------------------------------------------ jQuery page (formhelper.bundle.js)
  await browser.goto(base + "/Home/TagHelper");
  await browser.eval(helpers);

  let r = await browser.eval(`return { fh: !!window.FormHelper, jq: !!(window.jQuery && jQuery.validator && jQuery.validator.unobtrusive), toastr: typeof fhToastr.success };`);
  check("jquery page: FormHelper, jQuery Validation and fhToastr are loaded", r.fh && r.jq && r.toastr === "function", r);

  r = await browser.eval(`const f = __t.form(); await __t.submit(f); return { toasts: __t.toasts(), title: __t.msg(f, "Title"), cls: __t.input(f, "Title").className };`);
  check("jquery page: empty submit shows client errors and the per-form message", r.toasts.length === 1 && r.toasts[0].text === "Please check the product fields." && r.title === "'Title' must not be empty.", r);
  check("jquery page: invalid input gets the extra css class (is-invalid)", r.cls.includes("input-validation-error") && r.cls.includes("is-invalid"), r.cls);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Title", "hello"); __t.set(f, "Category", "1"); __t.set(f, "InStock", "0"); __t.set(f, "Active", true);
    await __t.submit(f); return { title: __t.msg(f, "Title"), inStock: __t.msg(f, "InStock"), disabled: f.querySelector("button[type=submit]").disabled };`);
  check("jquery page: server-side rules (NotEqual, When) are shown under the fields", r.title === "'Title' must not be equal to 'hello'." && r.inStock.includes("when the product is active"), r);
  check("jquery page: button is enabled again after a validation error", r.disabled === false, r);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Title", "admin"); __t.set(f, "InStock", "3"); await __t.submit(f); return { title: __t.msg(f, "Title") };`);
  check("jquery page: FluentValidation MustAsync rule runs on the server (FormHelper.FluentValidation)", r.title === "'admin' is a reserved name.", r);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Title", "Book"); __t.set(f, "InStock", "3"); await __t.submit(f);
    return { toasts: __t.toasts(), title: __t.input(f, "Title").value, disabled: f.querySelector("button[type=submit]").disabled, titleMsg: __t.msg(f, "Title") };`);
  check("jquery page: success shows the server message", r.toasts.length === 1 && r.toasts[0].text === "Product saved." && r.toasts[0].cls.includes("success"), r);
  check("jquery page: asp-resetFormAfterSuccess=false keeps values, asp-enableButtonAfterSuccess=true enables the button", r.title === "Book" && r.disabled === false, r);
  check("jquery page: previous server errors are cleared", r.titleMsg === "", r);

  r = await browser.eval(`const f = __t.form(); FormHelper.showErrors(f, [{ propertyName: "Title", messages: ["<img src=x onerror=window.__xss=1>", "second line"] }]);
    await __t.sleep(300); const s = f.querySelector('[data-valmsg-for="Title"]'); return { xss: window.__xss, text: s.textContent, html: s.innerHTML, imgs: s.querySelectorAll("img").length };`);
  check("jquery page: server messages are never rendered as html (XSS)", r.xss === undefined && r.imgs === 0 && r.text.includes("<img"), r);
  check("jquery page: multiple messages are shown on separate lines", r.html.includes("<br>") && r.text.includes("second line"), r.html);

  r = await browser.eval(`const f = __t.form(); FormHelper.reset(f); await __t.sleep(100); return { title: __t.input(f, "Title").value, msg: __t.msg(f, "Title") };`);
  check("jquery page: FormHelper.reset(form) clears values and messages", r.title === "" && r.msg === "", r);

  r = await browser.eval(`const f = __t.form(); FormHelper.fill(f, { title: "Filled", category: 3, active: false, userType: "Operator" });
    return { title: __t.input(f, "Title").value, category: __t.input(f, "Category").value, active: __t.input(f, "Active").checked, userType: f.querySelector("input[name=UserType]:checked").value };`);
  check("jquery page: FormHelper.fill fills text, select, checkbox and radio (case-insensitive names)", r.title === "Filled" && r.category === "3" && r.active === false && r.userType === "Operator", r);

  r = await browser.eval(`fhToastr.remove(); fhToastr.success("<b>bold</b>"); fhToastr.info("<b>x</b>", null, { escapeHtml: false });
    const t = document.querySelectorAll("#formhelper-toast-container > div"); return { first: t[1].innerHTML, second: t[0].innerHTML };`);
  check("fhToastr escapes by default and allows html with escapeHtml:false", r.first.includes("&lt;b&gt;") && r.second.includes("<b>x</b>"), r);

  r = await browser.eval(`const f = __t.form(); FormHelper.reset(f); __t.set(f, "Title", "abc"); __t.blur(f, "Title");
    await __t.until(() => __t.msg(f, "Title").includes("exist")); return { msg: __t.msg(f, "Title") };`);
  check("jquery page: [Remote] works through jQuery Validation Unobtrusive", r.msg === "'Abc' is already exist in the database.", r);

  r = await browser.eval(`const f = __t.form(); FormHelper.reset(f); __t.set(f, "Title", "Book"); __t.set(f, "Category", "1"); __t.set(f, "InStock", "3");
    fhToastr.remove(); jQuery(f).submit(); await __t.until(() => __t.toasts().length > 0); return { path: location.pathname, toasts: __t.toasts() };`);
  check("jquery page: $(form).submit() posts with ajax", r.path === "/Home/TagHelper" && r.toasts[0]?.text === "Product saved.", r);

  // The page's own validator (created by Unobtrusive on load) is used as it is: its settings and the rules it
  // changed stay, also when fields are added later.
  r = await browser.eval(`const f = __t.form(); FormHelper.reset(f);
    const validator = jQuery(f).data("validator"); validator.settings.ignore = ".fh-ignore";
    jQuery(__t.input(f, "Title")).rules("add", { minlength: 10, messages: { minlength: "At least 10 characters." } });
    __t.set(f, "Title", "Books"); __t.set(f, "Category", "1"); __t.set(f, "InStock", "3");
    const first = await __t.submit(f); const a = __t.msg(f, "Title");
    const add = (name, attributes, className) => {
      const input = document.createElement("input"); input.name = name; input.className = className || "";
      Object.keys(attributes).forEach((k) => input.setAttribute(k, attributes[k]));
      const message = document.createElement("span"); message.setAttribute("data-valmsg-for", name); message.setAttribute("data-valmsg-replace", "true");
      f.querySelector("button[type=submit]").before(input, message);
      return [input, message];
    };
    const added = [
      ...add("Extra", { "data-val": "true", "data-val-required": "Extra is required." }),
      ...add("Skipped", { "data-val": "true", "data-val-required": "Skipped is required." }, "fh-ignore"),
      ...add("Code", { "data-val": "true", "data-val-regex": "Bad code.", "data-val-regex-pattern": "(?>ab|a)c", value: "abc" })];
    const second = await __t.submit(f);
    const b = { title: __t.msg(f, "Title"), extra: __t.msg(f, "Extra"), skipped: __t.msg(f, "Skipped"), same: jQuery(f).data("validator") === validator };
    const originalWarn = console.warn; console.warn = () => {};
    __t.set(f, "Title", "Books and more"); __t.set(f, "Extra", "x");
    const third = await __t.submit(f); const c = { toasts: __t.toasts(), code: __t.msg(f, "Code") };
    console.warn = originalWarn; added.forEach((e) => e.remove()); FormHelper.reset(f);
    return { first, a, second, b, third, c };`);
  check("jquery page: a rule changed with .rules(\"add\") is kept", r.first === "formhelper:invalid" && r.a === "At least 10 characters.", r);
  check("jquery page: fields added later are validated, with the validator's settings and changed rules kept", r.second === "formhelper:invalid" && r.b.title === "At least 10 characters." && r.b.extra === "Extra is required." && r.b.skipped === "" && r.b.same, r);
  check("jquery page: a pattern JavaScript can't parse doesn't block the form", r.third === "formhelper:complete" && r.c.toasts[0]?.text === "Product saved." && r.c.code === "", r);

  // ------------------------------------------------------------------ modal (a form added after the page load)
  r = await browser.eval(`fhToastr.remove(); document.getElementById("openModal").click();
    await __t.until(() => document.querySelector("#remoteModal form")); await __t.sleep(300);
    const f = document.querySelector("#remoteModal form"); await __t.submit(f);
    return { found: !!f, toasts: __t.toasts(), title: __t.msg(f, "Title") };`);
  check("modal: a form loaded later is handled", r.found && r.toasts.length === 1 && r.title === "'Title' must not be empty.", r);

  // ------------------------------------------------------------------ html helper page
  await browser.goto(base + "/Home/HtmlHelper");
  await browser.eval(helpers);

  r = await browser.eval(`const f = __t.form("#ProductForm"); const attrs = { marker: f.hasAttribute("data-formhelper"), callback: f.dataset.fhCallback };
    __t.set(f, "Title", "Book"); __t.set(f, "Category", "2"); __t.set(f, "InStock", "4");
    await __t.submit(f); return { attrs, toasts: __t.toasts() };`);
  check("html helper: RenderFormScript sets the attributes and the form posts", r.attrs.marker && r.attrs.callback === "ProductFormCallback" && r.toasts[0]?.text === "Product saved.", r);

  // ------------------------------------------------------------------ without jQuery (built-in validator, JSON)
  await browser.goto(base + "/Home/WithoutJQuery");
  await browser.eval(helpers);

  r = await browser.eval(`return { jq: typeof window.jQuery, fh: !!window.FormHelper };`);
  check("builtin page: no jQuery on the page", r.jq === "undefined" && r.fh, r);

  r = await browser.eval(`const f = __t.form(); await __t.submit(f);
    return { toasts: __t.toasts(), title: __t.msg(f, "Title"), category: __t.msg(f, "Category"), cls: __t.input(f, "Title").className, aria: __t.input(f, "Title").getAttribute("aria-invalid"), focused: document.activeElement && document.activeElement.name };`);
  check("builtin page: empty submit shows client errors", r.toasts[0]?.text === "Check the form fields." && r.title === "'Title' must not be empty." && r.category === "'Category' must not be empty.", r);
  check("builtin page: css classes, aria-invalid and focus on the first invalid field", r.cls.includes("is-invalid") && r.aria === "true" && r.focused === "Title", r);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Title", "Bo"); await __t.sleep(100); const a = __t.msg(f, "Title");
    __t.set(f, "Title", "Book"); await __t.sleep(100); return { a, b: __t.msg(f, "Title"), cls: __t.input(f, "Title").className };`);
  check("builtin page: minlength while typing, then the message goes away", r.a === "The length of 'Title' must be at least 3 characters." && r.b === "" && !r.cls.includes("is-invalid"), r);

  // ASP.NET adds data-val-number only for float/double/decimal properties.
  r = await browser.eval(`const f = __t.form(); __t.input(f, "InStock").setAttribute("data-val-number", "The field In Stock must be a number.");
    __t.set(f, "InStock", "1,5"); __t.blur(f, "InStock"); await __t.sleep(100); const comma = __t.msg(f, "InStock");
    __t.set(f, "InStock", "abc"); __t.blur(f, "InStock"); await __t.sleep(100); return { comma, text: __t.msg(f, "InStock") };`);
  check("builtin page: number rule accepts a comma decimal and rejects text", r.comma === "" && r.text === "The field In Stock must be a number.", r);

  r = await browser.eval(`const f = __t.form(); window.__events = []; ["before-submit", "success", "error", "complete"].forEach((n) => f.addEventListener("formhelper:" + n, () => __events.push(n)));
    __t.set(f, "Title", "Book"); __t.set(f, "Category", "2"); __t.set(f, "InStock", "5"); __t.set(f, "Active", true); __t.set(f, "UserType", "Moderator");
    await __t.submit(f); return { toasts: __t.toasts(), events: __events };`);
  check("builtin page: json post binds text, number, enum and checkbox", r.toasts[0]?.text === "Product saved: Book (Phone), active: True", r);
  check("builtin page: DOM events are raised in order", JSON.stringify(r.events) === JSON.stringify(["before-submit", "success", "complete"]), r.events);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Active", false); __t.set(f, "InStock", "0"); await __t.submit(f); return __t.toasts();`);
  check("builtin page: an unchecked checkbox is sent as false in json", r[0]?.text === "Product saved: Book (Phone), active: False", r);

  r = await browser.eval(`const f = __t.form(); window.__calls = []; const originalFetch = window.fetch;
    window.fetch = function (url) { __calls.push(String(url)); return originalFetch.apply(this, arguments); };
    __t.set(f, "Title", "abc"); __t.blur(f, "Title"); await __t.until(() => __t.msg(f, "Title").includes("exist")); const a = __t.msg(f, "Title");
    __t.blur(f, "Title"); await __t.sleep(300);
    const remoteCalls = __calls.filter((c) => c.includes("CheckTitle")).length;
    await __t.submit(f); const saveCalls = __calls.filter((c) => c.includes("SaveJson")).length; const toasts = __t.toasts();
    __t.set(f, "Title", "Book"); __t.blur(f, "Title"); await __t.until(() => __t.msg(f, "Title") === "");
    window.fetch = originalFetch;
    return { a, remoteCalls, saveCalls, toasts, b: __t.msg(f, "Title"), url: __calls.find((c) => c.includes("CheckTitle")) };`);
  check("builtin page: [Remote] shows the server's message", r.a === "'Abc' is already exist in the database.", r);
  check("builtin page: [Remote] sends the field and doesn't ask twice for the same value", r.remoteCalls === 1 && r.url.includes("Title=abc"), r);
  check("builtin page: [Remote] error blocks the submit", r.saveCalls === 0 && r.toasts[0]?.text === "Check the form fields.", r);
  check("builtin page: [Remote] message goes away when the value is valid", r.b === "", r);

  r = await browser.eval(`const f = __t.form(); FormHelper.showErrors(f, { Title: "<img src=x onerror=window.__xss=1>" }); await __t.sleep(200);
    return { xss: window.__xss, imgs: f.querySelectorAll("img").length, text: __t.msg(f, "Title") };`);
  check("builtin page: server messages are never rendered as html (XSS)", r.xss === undefined && r.imgs === 0 && r.text.includes("<img"), r);

  r = await browser.eval(`const f = __t.form(); const written = f.dataset.fhErrorMessage; const originalFetch = window.fetch; const originalError = console.error; console.error = () => {};
    window.fetch = () => Promise.resolve(new Response("<h1>Server error</h1>", { status: 500, headers: { "Content-Type": "text/html" } }));
    f.setAttribute("data-fh-error-message", "Sunucu hatası.");
    __t.set(f, "Title", "Book"); __t.set(f, "Category", "2"); __t.set(f, "InStock", "5");
    await __t.submit(f); window.fetch = originalFetch; console.error = originalError;
    return { written, toasts: __t.toasts(), disabled: f.querySelector("button[type=submit]").disabled };`);
  check("builtin page: the tag helper writes FormHelperOptions.ErrorMessage to the form", r.written === "An error occurred. Please try again.", r);
  check("builtin page: a response that isn't a FormResult shows the form's error message", r.toasts[0]?.text === "Sunucu hatası." && r.toasts[0].cls.includes("error") && r.disabled === false, r);

  r = await browser.eval(`FormHelper.validation.addRule("uppercase", (value) => value === value.toUpperCase() || "Must be upper case.");
    const f = __t.form(); __t.input(f, "Title").setAttribute("data-val-uppercase", "Upper case please");
    __t.set(f, "Title", "book"); __t.blur(f, "Title"); await __t.sleep(100); const a = __t.msg(f, "Title");
    __t.set(f, "Title", "BOOK"); await __t.sleep(100); return { a, b: __t.msg(f, "Title") };`);
  check("builtin page: custom rule with FormHelper.validation.addRule", r.a === "Must be upper case." && r.b === "", r);

  // The errors of the previous response are cleared, also when no client-side validation runs.
  r = await browser.eval(`const f = __t.form(); f.dataset.fhValidation = "none"; const originalFetch = window.fetch;
    const responses = [
      { status: 4, isSucceed: false, validationErrors: [{ propertyName: "Title", messages: ["Title is taken."] }] },
      { status: 4, isSucceed: false, validationErrors: [{ propertyName: "Category", messages: ["Category is closed."] }] },
      { status: 1, isSucceed: true, message: "Saved." }];
    let i = 0;
    window.fetch = () => Promise.resolve(new Response(JSON.stringify(responses[i++]), { headers: { "Content-Type": "application/json" } }));
    __t.set(f, "Title", "BOOK");
    await __t.submit(f); const a = __t.msg(f, "Title");
    await __t.submit(f); const b = { title: __t.msg(f, "Title"), titleClass: __t.input(f, "Title").className, category: __t.msg(f, "Category") };
    await __t.submit(f); const c = __t.msg(f, "Category");
    window.fetch = originalFetch; delete f.dataset.fhValidation;
    return { a, b, c };`);
  check("builtin page: errors of the previous response are cleared (validation: none)", r.a === "Title is taken." && r.b.title === "" && !r.b.titleClass.includes("is-invalid") && r.b.category === "Category is closed." && r.c === "", r);

  // JSON that isn't a FormResult, e.g. ASP.NET's ProblemDetails for an unhandled exception.
  r = await browser.eval(`const f = __t.form(); const originalFetch = window.fetch; const originalError = console.error; console.error = () => {};
    window.fetch = () => Promise.resolve(new Response(JSON.stringify({ type: "https://tools.ietf.org/html/rfc9110#section-15.6.1", title: "An error occurred while processing your request.", status: 500 }),
      { status: 500, headers: { "Content-Type": "application/problem+json" } }));
    await __t.submit(f); window.fetch = originalFetch; console.error = originalError;
    return __t.toasts();`);
  check("builtin page: a ProblemDetails response shows the error message, not the form fields message", r[0]?.text === "Sunucu hatası.", r);

  // FormHelper.FluentValidation sends Matches patterns wrapped, so they are found anywhere in the value.
  r = await browser.eval(`const f = __t.form(); const t = __t.input(f, "Title");
    t.setAttribute("data-val-regex", "Needs upper case letters."); t.setAttribute("data-val-regex-pattern", "[\\\\s\\\\S]*?(?:[A-Z]+)[\\\\s\\\\S]*");
    __t.set(f, "Title", "ABC123"); __t.blur(f, "Title"); await __t.sleep(100); const a = __t.msg(f, "Title");
    t.setAttribute("data-val-regex-pattern", "(?i)^abc$"); const originalWarn = console.warn; console.warn = () => {};
    __t.set(f, "Title", "XYZ"); __t.blur(f, "Title"); await __t.sleep(100); const b = __t.msg(f, "Title"); const valid = await FormHelper.validate(f);
    console.warn = originalWarn; t.removeAttribute("data-val-regex"); t.removeAttribute("data-val-regex-pattern");
    return { a, b, valid };`);
  check("builtin page: a wrapped pattern matches anywhere in the value", r.a === "", r);
  check("builtin page: a pattern JavaScript can't parse doesn't block the form", r.b === "" && r.valid === true, r);

  // [MinLength] / [MaxLength] on a collection count the selected items, like jQuery Validation and the server.
  r = await browser.eval(`const f = __t.form();
    const add = (name, rule, limit) => {
      const select = document.createElement("select"); select.name = name; select.multiple = true;
      ["a", "b", "c"].forEach((v) => select.add(new Option(v, v)));
      select.setAttribute("data-val", "true"); select.setAttribute("data-val-" + rule, name + " " + rule + " " + limit + ".");
      select.setAttribute("data-val-" + rule + "-" + (rule === "maxlength" ? "max" : "min"), String(limit));
      const message = document.createElement("span"); message.setAttribute("data-valmsg-for", name); message.setAttribute("data-valmsg-replace", "true");
      f.querySelector("button[type=submit]").before(select, message);
      return [select, message];
    };
    const choose = (select, values) => Array.from(select.options).forEach((o) => (o.selected = values.indexOf(o.value) !== -1));
    const [most, mostMessage] = add("Most", "maxlength", 2);
    const [least, leastMessage] = add("Least", "minlength", 2);
    choose(most, ["a", "b"]); __t.blur(f, "Most"); await __t.sleep(50); const two = __t.msg(f, "Most");
    choose(most, ["a", "b", "c"]); __t.blur(f, "Most"); await __t.sleep(50); const three = __t.msg(f, "Most");
    choose(least, ["a"]); __t.blur(f, "Least"); await __t.sleep(50); const one = __t.msg(f, "Least");
    choose(least, ["a", "b"]); __t.blur(f, "Least"); await __t.sleep(50); const enough = __t.msg(f, "Least");
    [most, mostMessage, least, leastMessage].forEach((e) => e.remove());
    return { two, three, one, enough };`);
  check("builtin page: maxlength counts the selected items of a multiple select", r.two === "" && r.three === "Most maxlength 2.", r);
  check("builtin page: minlength counts the selected items of a multiple select", r.one === "Least minlength 2." && r.enough === "", r);

  // An action without [FormValidator] returned a redirect: fetch followed it and got html. The page must go there.
  await browser.eval(`const f = __t.form(); window.__beforeRedirect = true;
    window.fetch = () => Promise.resolve({ ok: true, status: 200, redirected: true, url: location.origin + "/Home/HtmlHelper",
      headers: new Headers({ "Content-Type": "text/html" }), text: () => Promise.resolve("<html></html>") });
    __t.set(f, "Title", "BOOK"); // upper case: the custom rule above is still on the field __t.set(f, "Category", "2"); __t.set(f, "InStock", "5");
    f.querySelector("button[type=submit]").click();`);
  for (let i = 0; i < 50; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      r = await browser.eval(`return { reloaded: !window.__beforeRedirect, path: location.pathname };`);
      if (r.reloaded) break;
    } catch {
      // navigating
    }
  }
  check("builtin page: a redirect followed by fetch (no [FormValidator]) goes to the page it ended on", r.reloaded && r.path === "/Home/HtmlHelper", r);

  // ------------------------------------------------------------------ Razor Pages
  await browser.goto(base + "/Product");
  await browser.eval(helpers);

  r = await browser.eval(`const s = __t.form().querySelector("[data-valmsg-summary]"); return getComputedStyle(s).display;`);
  check("razor pages: the empty validation summary is hidden", r === "none", r);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Input.Title", "Book"); __t.set(f, "Input.Category", "1"); __t.set(f, "Input.InStock", "60");
    await __t.submit(f); const s = f.querySelector("[data-valmsg-summary]");
    return { toasts: __t.toasts(), summary: s.textContent.trim(), cls: s.className, display: getComputedStyle(s).display };`);
  check("razor pages: a model-level error goes to the toast and the validation summary", r.toasts[0]?.text === "The warehouse can't hold more than 50 items." && r.summary === "The warehouse can't hold more than 50 items." && r.cls.includes("validation-summary-errors") && r.display !== "none", r);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Input.Title", "hello"); __t.set(f, "Input.InStock", "2"); await __t.submit(f); return { title: __t.msg(f, "Input.Title") };`);
  check("razor pages: server errors use the bound property prefix (Input.Title)", r.title === "'Title' must not be equal to 'hello'.", r);

  // Razor Pages validate the antiforgery token before [FormValidator] runs; the user still gets FormHelper's message.
  r = await browser.eval(`const f = __t.form(); const token = f.querySelector("input[name=__RequestVerificationToken]"); const value = token.value;
    token.value = "invalid"; __t.set(f, "Input.Title", "Book"); __t.set(f, "Input.InStock", "2");
    const originalError = console.error; console.error = () => {};
    await __t.submit(f); console.error = originalError; token.value = value;
    return __t.toasts();`);
  check("razor pages: an invalid antiforgery token shows the invalid request message", r[0]?.text === "Your session has expired. Please refresh the page and try again." && r[0].cls.includes("error"), r);

  r = await browser.eval(`const f = __t.form(); __t.set(f, "Input.Title", "abc"); __t.blur(f, "Input.Title"); await __t.until(() => __t.msg(f, "Input.Title").includes("exist"));
    const remote = __t.msg(f, "Input.Title");
    __t.set(f, "Input.Title", "Book"); __t.blur(f, "Input.Title"); await __t.until(() => __t.msg(f, "Input.Title") === "");
    window.__beforeRedirect = true; await __t.submit(f); return { remote, toasts: __t.toasts() };`);
  check("razor pages: [Remote] works with the Input. prefix", r.remote === "'Abc' is already exist in the database.", r);
  check("razor pages: success with a redirect keeps the message on screen", r.toasts[0]?.text === "Product saved." && r.toasts[0].cls.includes("success"), r);

  // The sample redirects after 3 seconds.
  for (let i = 0; i < 60; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    try {
      r = await browser.eval(`return { reloaded: !window.__beforeRedirect, path: location.pathname, title: document.querySelector("input[name='Input.Title']")?.value };`);
      if (r.reloaded && r.title !== undefined) break;
    } catch {
      // navigating
    }
  }
  check("razor pages: redirects after the delay", r.reloaded && r.path === "/Product" && r.title === "", r);

  // A [Remote] action's message often contains what the user typed; jQuery Validation would show it as html.
  await browser.goto(base + "/Product");
  await browser.eval(helpers);
  r = await browser.eval(`const f = __t.form();
    jQuery.ajaxTransport("+json", (options) => options.url.indexOf("CheckTitle") === -1 ? undefined : {
      send: (headers, complete) => setTimeout(() => complete(200, "success", { text: JSON.stringify("<img src=x onerror=window.__xss=1>Evil") }), 10),
      abort: () => {}
    });
    __t.set(f, "Input.Title", "Evil"); __t.set(f, "Input.Category", "1"); __t.set(f, "Input.InStock", "2");
    __t.blur(f, "Input.Title"); await __t.until(() => __t.msg(f, "Input.Title") !== "");
    const field = __t.msg(f, "Input.Title");
    await __t.submit(f); await __t.sleep(300);
    const summary = f.querySelector("[data-valmsg-summary]").textContent.trim();
    return { field, summary, imgs: f.querySelectorAll("img").length, xss: window.__xss };`);
  check("razor pages: a [Remote] message is shown as text in the field and the summary (XSS)", r.field === "<img src=x onerror=window.__xss=1>Evil" && r.summary.includes("<img src=x") && r.imgs === 0 && r.xss === undefined, r);
}
