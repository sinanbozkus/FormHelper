using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System;
using System.Threading.Tasks;

namespace FormHelper
{
    /// <summary>
    /// Extra validation that <see cref="FormValidator"/> runs (asynchronously) for each bound model before
    /// checking the model state. Register implementations in DI; FormHelper.FluentValidation uses this.
    /// </summary>
    public interface IFormModelValidator
    {
        Task ValidateAsync(FormModelValidationContext context);
    }

    public sealed class FormModelValidationContext
    {
        public FormModelValidationContext(HttpContext httpContext, ModelStateDictionary modelState, object model, string prefix)
        {
            HttpContext = httpContext;
            ModelState = modelState;
            Model = model;
            Prefix = prefix;
        }

        public HttpContext HttpContext { get; }

        public ModelStateDictionary ModelState { get; }

        public object Model { get; }

        public Type ModelType => Model.GetType();

        /// <summary>
        /// The model state key prefix the model was bound with ("" when the fields are posted without a prefix).
        /// Add errors with <c>ModelState.AddModelError(GetKey("Title"), ...)</c>.
        /// </summary>
        public string Prefix { get; }

        public string GetKey(string propertyPath)
        {
            if (Prefix.Length == 0)
            {
                return propertyPath;
            }

            if (propertyPath.Length == 0)
            {
                return Prefix;
            }

            return propertyPath[0] == '[' ? Prefix + propertyPath : Prefix + "." + propertyPath;
        }
    }
}
