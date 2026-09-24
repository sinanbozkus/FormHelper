import { FormHelper } from "./core.js";
import { toastr } from "./toast.js";
import { protectJQueryValidation } from "./validation/jquery.js";

// Runs when jQuery is on the page (it may be loaded after this script).
function registerJQuery() {
  const $ = window.jQuery;

  if (!$ || !$.fn) {
    return;
  }

  // jQuery 4 removed $.parseJSON, which jQuery Validation Unobtrusive 4.0.0 still calls. It was JSON.parse.
  if (!$.parseJSON) {
    $.parseJSON = JSON.parse;
  }

  protectJQueryValidation();

  if ($.formhelperRegistered) {
    return;
  }
  $.formhelperRegistered = true;

  // $(form).submit() / .trigger("submit") don't raise a native submit event, so the capture listener doesn't see
  // them and jQuery would post the form natively. jQuery Validation does this itself after a [Remote] check.
  $(document).on("submit.formhelper", "form[data-formhelper]", function (event) {
    if (event.originalEvent) {
      return; // a native submit, already handled
    }
    event.preventDefault();
    window.FormHelper.submit(this);
  });
}

// Loading the script twice (e.g. formhelper.js and formhelper.bundle.js) must not submit forms twice.
if (!window.FormHelper) {
  window.FormHelper = FormHelper;
  window.fhToastr = toastr;

  FormHelper.init();

  document.addEventListener("DOMContentLoaded", registerJQuery);
  window.addEventListener("load", registerJQuery);
}

registerJQuery();
