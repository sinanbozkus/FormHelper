// Global defaults, changed with FormHelper.configure({...}).
// The data-fh-* attributes written by the tag helper / html helper take precedence for a form.
export const globals = {
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
  notify: undefined
};

export function getFormOptions(form) {
  const data = form.dataset;

  const bool = (value, fallback) => (value == null ? fallback : value.toLowerCase() === "true");
  const text = (value, fallback) => (value == null || value === "" ? fallback : value);

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
