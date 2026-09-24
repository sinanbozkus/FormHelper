using System;
using System.Text.Json;

namespace FormHelper
{
    public class FormHelperOptions
    {
        /// <summary>
        /// Shown when the form has validation errors. Used as a resource key when <see cref="LocalizationResourceType"/> is set.
        /// </summary>
        public string CheckTheFormFieldsMessage { get; set; } = "Check the form fields.";

        /// <summary>
        /// Shown when the antiforgery token is missing or invalid (e.g. the page stayed open too long).
        /// Used as a resource key when <see cref="LocalizationResourceType"/> is set.
        /// </summary>
        public string InvalidRequestMessage { get; set; } = "Your session has expired. Please refresh the page and try again.";

        /// <summary>
        /// Shown when the response is not a <see cref="FormResult"/> (e.g. the error page of an unhandled exception).
        /// The details are written to the browser console. Used as a resource key when <see cref="LocalizationResourceType"/> is set.
        /// </summary>
        public string ErrorMessage { get; set; } = "An error occurred. Please try again.";

        /// <summary>
        /// Default delay (ms) before redirecting when a result has both a message and a redirect uri.
        /// </summary>
        public int RedirectDelay { get; set; } = 1500;

        public ToastrPosition ToastrDefaultPosition { get; set; } = ToastrPosition.TopRight;

        /// <summary>
        /// Which client-side validation engine the forms use. Can be overridden per form with asp-validation.
        /// </summary>
        public ClientValidation ClientValidation { get; set; } = ClientValidation.Auto;

        /// <summary>
        /// Extra CSS class(es) added to an invalid input, next to ASP.NET's standard "input-validation-error".
        /// e.g. "is-invalid" (Bootstrap) or "border-red-500" (Tailwind).
        /// </summary>
        public string? InputErrorCssClass { get; set; }

        /// <summary>
        /// Extra CSS class(es) added to a field's validation message, next to ASP.NET's standard "field-validation-error".
        /// e.g. "invalid-feedback d-block" (Bootstrap) or "text-sm text-red-600" (Tailwind).
        /// </summary>
        public string? MessageErrorCssClass { get; set; }

        /// <summary>
        /// When set, the messages above are treated as resource keys and localized with IStringLocalizer of this type.
        /// </summary>
        public Type? LocalizationResourceType { get; set; }

        /// <summary>
        /// Serializer options used when a <see cref="FormResult"/> is written to the response.
        /// FormResult's own properties are always camelCase; these options affect <see cref="FormResult.Object"/>.
        /// </summary>
        public JsonSerializerOptions JsonSerializerOptions { get; set; } = FormResult.CreateDefaultJsonSerializerOptions();
    }
}
