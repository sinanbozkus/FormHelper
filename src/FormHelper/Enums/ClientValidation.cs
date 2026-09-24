namespace FormHelper
{
    public enum ClientValidation
    {
        /// <summary>
        /// Uses jQuery Validation Unobtrusive when it is on the page, otherwise the built-in validator.
        /// </summary>
        Auto,

        /// <summary>
        /// Always uses jQuery Validation Unobtrusive (it must be on the page).
        /// </summary>
        JQuery,

        /// <summary>
        /// Always uses the built-in validator, even if jQuery Validation is on the page.
        /// </summary>
        BuiltIn,

        /// <summary>
        /// No client-side validation; only server-side validation results are shown.
        /// </summary>
        None
    }
}
