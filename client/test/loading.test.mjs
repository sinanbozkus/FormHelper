// How the scripts behave next to other scripts: an existing jQuery Validation, jQuery 4, loading twice.

const load = `window.__load = (src) => new Promise((resolve, reject) => {
  const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = reject; document.body.appendChild(s);
});`;

export default async function (browser, base, check) {
  // A project that already loads jQuery Validation (e.g. _ValidationScriptsPartial) with a custom rule,
  // and then formhelper.bundle.js: the bundle must not load them again.
  await browser.goto(base + "/Home/WithoutJQuery");
  let r = await browser.eval(`${load}
    await __load("https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js");
    await __load("https://cdn.jsdelivr.net/npm/jquery-validation@1.19.5/dist/jquery.validate.min.js");
    await __load("https://cdn.jsdelivr.net/npm/jquery-validation-unobtrusive@4.0.0/dist/jquery.validate.unobtrusive.min.js");
    jQuery.validator.addMethod("projectrule", () => true);
    const validator = jQuery.validator;
    await __load("/formhelper/formhelper.bundle.js");
    return { same: jQuery.validator === validator, custom: typeof jQuery.validator.methods.projectrule, registered: jQuery.formhelperRegistered };`);
  check("bundle: an existing jQuery Validation is kept (custom rules survive)", r.same && r.custom === "function", r);
  check("bundle: the jQuery submit handler is registered when jQuery is loaded after formhelper.js", r.registered === true, r);

  // jQuery 4 + the bundle (jQuery Validation 1.22.1 + Unobtrusive 4.0.0)
  await browser.goto(base + "/Home/WithoutJQuery");
  r = await browser.eval(`${load}
    await __load("https://cdn.jsdelivr.net/npm/jquery@4.0.0/dist/jquery.min.js");
    await __load("/formhelper/formhelper.bundle.min.js");
    jQuery.validator.unobtrusive.parse(document);
    const f = document.querySelector("form[data-formhelper]");
    f.dataset.fhValidation = "jquery";
    fhToastr.remove();
    const done = new Promise((resolve) => f.addEventListener("formhelper:invalid", resolve));
    f.querySelector("button[type=submit]").click();
    await done;
    return { jquery: jQuery.fn.jquery, title: f.querySelector('[data-valmsg-for="Title"]').textContent, toast: document.querySelector("#formhelper-toast-container > div")?.textContent };`);
  check("jQuery 4: the bundle validates the form", r.jquery.startsWith("4.") && r.title === "'Title' must not be empty." && r.toast === "Check the form fields.", r);

  // jQuery, jQuery Validation, formhelper.js and then Unobtrusive: the regex guard must still reach Unobtrusive's
  // "regex" method, which didn't exist when formhelper.js ran.
  await browser.goto(base + "/Home/WithoutJQuery");
  r = await browser.eval(`${load}
    await __load("https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js");
    await __load("https://cdn.jsdelivr.net/npm/jquery-validation@1.19.5/dist/jquery.validate.min.js");
    await __load("/formhelper/formhelper.js");
    const f = document.querySelector("form[data-formhelper]");
    const title = Array.from(f.elements).find((e) => e.name === "Title");
    title.setAttribute("data-val-regex", "abc only"); title.setAttribute("data-val-regex-pattern", "(?i)^abc$");
    await __load("https://cdn.jsdelivr.net/npm/jquery-validation-unobtrusive@4.0.0/dist/jquery.validate.unobtrusive.min.js");
    f.dataset.fhValidation = "jquery";
    const set = (n, v) => { Array.from(f.elements).find((e) => e.name === n && e.type !== "hidden").value = v; };
    set("Title", "Book"); set("Category", "2"); set("InStock", "5");
    const originalWarn = console.warn; console.warn = () => {};
    const done = new Promise((resolve) => {
      ["formhelper:complete", "formhelper:invalid"].forEach((n) => f.addEventListener(n, (e) => resolve(e.type)));
      setTimeout(() => resolve("timeout"), 5000);
    });
    f.querySelector("button[type=submit]").click();
    const result = await done;
    console.warn = originalWarn;
    return { result, guarded: !!jQuery.validator.methods.regex.formhelperGuarded };`);
  check("jQuery Validation, formhelper.js, then Unobtrusive: a pattern JavaScript can't parse doesn't block the form", r.result === "formhelper:complete" && r.guarded, r);

  // Loading formhelper.js twice must not submit a form twice.
  await browser.goto(base + "/Home/WithoutJQuery");
  r = await browser.eval(`${load}
    await __load("/formhelper/formhelper.js");
    let posts = 0; const originalFetch = window.fetch;
    window.fetch = function (url) { if (String(url).includes("SaveJson")) posts++; return originalFetch.apply(this, arguments); };
    const f = document.querySelector("form[data-formhelper]");
    const set = (n, v) => { Array.from(f.elements).find((e) => e.name === n && e.type !== "hidden").value = v; };
    set("Title", "Book"); set("Category", "2"); set("InStock", "5");
    const done = new Promise((resolve) => f.addEventListener("formhelper:complete", resolve));
    f.querySelector("button[type=submit]").click();
    await done;
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.fetch = originalFetch;
    return { posts };`);
  check("loading the script twice does not submit twice", r.posts === 1, r);
}
