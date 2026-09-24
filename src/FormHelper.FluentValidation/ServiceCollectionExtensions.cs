using FormHelper;
using FormHelper.FluentValidation;
using FormHelper.FluentValidation.ClientSide;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System;
using System.Linq;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class FormHelperFluentValidationServiceCollectionExtensions
    {
        /// <summary>
        /// Validates the models of [FormValidator] actions and Razor Pages with their IValidator&lt;T&gt;
        /// and adds client-side validation attributes for the rules that can run in the browser.
        /// Register the validators too, e.g. services.AddValidatorsFromAssemblyContaining&lt;ProductValidator&gt;().
        /// </summary>
        public static IServiceCollection AddFormHelperFluentValidation(this IServiceCollection services, Action<FormHelperFluentValidationOptions>? configure = null)
        {
            var options = new FormHelperFluentValidationOptions();
            configure?.Invoke(options);

            services.TryAddEnumerable(ServiceDescriptor.Singleton<IFormModelValidator, FluentValidationFormModelValidator>());

            if (options.ClientSideValidation)
            {
                // PostConfigure runs after every Configure, so FluentValidation.AspNetCore's adapters are visible here.
                services.PostConfigure<MvcViewOptions>(mvc =>
                {
                    var providers = mvc.ClientModelValidatorProviders;

                    if (providers.Any(p => p is FluentValidationClientModelValidatorProvider ||
                                           p.GetType().FullName == "FluentValidation.AspNetCore.FluentValidationClientModelValidatorProvider"))
                    {
                        return;
                    }

                    // First, so FluentValidation's messages win over the implicit DataAnnotations ones (e.g. "required").
                    providers.Insert(0, new FluentValidationClientModelValidatorProvider());
                });
            }

            return services;
        }

        /// <inheritdoc cref="AddFormHelperFluentValidation(IServiceCollection, Action{FormHelperFluentValidationOptions})"/>
        public static IMvcBuilder AddFormHelperFluentValidation(this IMvcBuilder builder, Action<FormHelperFluentValidationOptions>? configure = null)
        {
            builder.Services.AddFormHelperFluentValidation(configure);
            return builder;
        }
    }
}
