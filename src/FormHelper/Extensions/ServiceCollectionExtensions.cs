using Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System;
using System.Reflection;

namespace FormHelper
{
    public static class ServiceCollectionExtensions
    {
        public static IMvcBuilder AddFormHelper(this IMvcBuilder builder, Action<FormHelperOptions> options = null)
        {
            var _options = new FormHelperOptions
            {
                CheckTheFormFieldsMessage = "Check the form fields.",
                RedirectDelay = 1500,
                ToastrDefaultPosition = ToastrPosition.TopRight
            };

            if (options != null)
            {
                options(_options);
            }

            builder.Services.AddSingleton(_options);

            if (_options.EmbeddedFiles == true)
            {
                builder.Services.Configure<MvcRazorRuntimeCompilationOptions>(options =>
                {
                    options.FileProviders.Add(new EmbeddedFileProvider(typeof(FormHelperHtmlHelpers).GetTypeInfo().Assembly));
                });
            }

            return builder;
        }
    }
}