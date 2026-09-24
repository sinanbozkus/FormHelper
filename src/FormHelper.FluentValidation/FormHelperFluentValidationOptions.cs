namespace FormHelper.FluentValidation
{
    public class FormHelperFluentValidationOptions
    {
        /// <summary>
        /// Adds data-val-* attributes for the rules that can run in the browser (default: true).
        /// When false, Fluent Validation rules are only validated on the server.
        /// </summary>
        public bool ClientSideValidation { get; set; } = true;
    }
}
