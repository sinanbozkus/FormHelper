using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace FormHelper.FluentValidation
{
    /// <summary>
    /// Runs the model's IValidator&lt;T&gt; (registered in DI) for [FormValidator] actions and Razor Pages.
    /// Validation is asynchronous, so MustAsync / CustomAsync rules work.
    /// </summary>
    internal sealed class FluentValidationFormModelValidator : IFormModelValidator
    {
        private const string AutoValidationProvider = "FluentValidation.AspNetCore.FluentValidationModelValidatorProvider";

        private bool? _autoValidationEnabled;

        public async Task ValidateAsync(FormModelValidationContext context)
        {
            var services = context.HttpContext.RequestServices;

            // FluentValidation.AspNetCore's auto validation already validated the model during model binding.
            if (IsAutoValidationEnabled(services))
            {
                return;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(context.ModelType);

            if (!(services.GetService(validatorType) is IValidator validator))
            {
                return;
            }

            var validationContext = new ValidationContext<object>(context.Model);
            var result = await validator.ValidateAsync(validationContext, context.HttpContext.RequestAborted);

            foreach (var error in result.Errors)
            {
                context.ModelState.AddModelError(context.GetKey(error.PropertyName ?? ""), error.ErrorMessage);
            }
        }

        private bool IsAutoValidationEnabled(IServiceProvider services)
        {
            if (_autoValidationEnabled == null)
            {
                var mvcOptions = services.GetService<IOptions<MvcOptions>>()?.Value;

                _autoValidationEnabled = mvcOptions != null &&
                    mvcOptions.ModelValidatorProviders.Any(p => p.GetType().FullName == AutoValidationProvider);
            }

            return _autoValidationEnabled.Value;
        }
    }
}
