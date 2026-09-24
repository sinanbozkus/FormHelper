using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;

namespace FormHelper
{
    public static class ServiceCollectionExtensions
    {
        public static IMvcBuilder AddFormHelper(this IMvcBuilder builder, Action<FormHelperOptions>? options = null)
        {
            builder.Services.AddFormHelper(options);

            return builder;
        }

        public static IServiceCollection AddFormHelper(this IServiceCollection services, Action<FormHelperOptions>? options = null)
        {
            services.AddOptions<FormHelperOptions>();

            // [FormValidator] validates the antiforgery token; AddControllers() alone doesn't register it.
            services.AddAntiforgery();

            // An invalid token rejected before [FormValidator] runs (Razor Pages, [AutoValidateAntiforgeryToken])
            // still gets FormHelper's message.
            services.Configure<MvcOptions>(mvc =>
            {
                if (!mvc.Filters.OfType<InvalidAntiforgeryResultFilter>().Any())
                {
                    mvc.Filters.Add(new InvalidAntiforgeryResultFilter());
                }
            });

            if (options != null)
            {
                services.Configure(options);
            }

            return services;
        }
    }
}
