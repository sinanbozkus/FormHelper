using System.Collections.Generic;
using System.Globalization;

namespace FormHelper
{
    /// <summary>
    /// The data-fh-* attributes the client script reads from a form. Shared by the tag helper and the html helper.
    /// </summary>
    internal sealed class FormHelperAttributes
    {
        public const string Marker = "data-formhelper";

        public FormDataType DataType { get; set; } = FormDataType.FormData;
        public int RedirectDelay { get; set; }
        public string? Callback { get; set; }
        public string? BeforeSubmit { get; set; }
        public ToastrPosition ToastrPosition { get; set; }
        public bool EnableButtonAfterSuccess { get; set; }
        public bool ResetFormAfterSuccess { get; set; }
        public string? CheckTheFormFieldsMessage { get; set; }
        public string? ErrorMessage { get; set; }
        public ClientValidation Validation { get; set; }
        public string? InputErrorCssClass { get; set; }
        public string? MessageErrorCssClass { get; set; }

        public static FormHelperAttributes FromOptions(FormHelperOptions options) => new FormHelperAttributes
        {
            RedirectDelay = options.RedirectDelay,
            ToastrPosition = options.ToastrDefaultPosition,
            Validation = options.ClientValidation,
            InputErrorCssClass = options.InputErrorCssClass,
            MessageErrorCssClass = options.MessageErrorCssClass
        };

        public Dictionary<string, string> ToDictionary()
        {
            var attributes = new Dictionary<string, string>
            {
                [Marker] = "",
                ["data-fh-data-type"] = DataType == FormDataType.Json ? "json" : "formdata",
                ["data-fh-redirect-delay"] = RedirectDelay.ToString(CultureInfo.InvariantCulture),
                ["data-fh-toastr-position"] = ToastrPosition.ToClassName(),
                ["data-fh-enable-button-after-success"] = EnableButtonAfterSuccess.ToAttributeValue(),
                ["data-fh-reset-form-after-success"] = ResetFormAfterSuccess.ToAttributeValue(),
                ["data-fh-validation"] = Validation.ToAttributeValue()
            };

            if (!string.IsNullOrWhiteSpace(Callback))
            {
                attributes["data-fh-callback"] = Callback!;
            }

            if (!string.IsNullOrWhiteSpace(BeforeSubmit))
            {
                attributes["data-fh-before-submit"] = BeforeSubmit!;
            }

            if (!string.IsNullOrEmpty(CheckTheFormFieldsMessage))
            {
                attributes["data-fh-check-message"] = CheckTheFormFieldsMessage!;
            }

            if (!string.IsNullOrEmpty(ErrorMessage))
            {
                attributes["data-fh-error-message"] = ErrorMessage!;
            }

            if (!string.IsNullOrWhiteSpace(InputErrorCssClass))
            {
                attributes["data-fh-input-error-class"] = InputErrorCssClass!;
            }

            if (!string.IsNullOrWhiteSpace(MessageErrorCssClass))
            {
                attributes["data-fh-message-error-class"] = MessageErrorCssClass!;
            }

            return attributes;
        }
    }
}
