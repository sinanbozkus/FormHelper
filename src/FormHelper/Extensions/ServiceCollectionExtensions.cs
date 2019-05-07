using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System.Reflection;

namespace FormHelper
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddFormHelper(this IServiceCollection services, FormHelperConfiguration config = null)
        {
            services.AddScoped<IFormHelperViewRenderService, FormHelperViewRenderService>();

            if (config == null)
                services.AddSingleton<FormHelperConfiguration>();
            else
                services.AddSingleton(config);

            services.Configure<RazorViewEngineOptions>(options =>
            {
                options.FileProviders.Add(
                    new EmbeddedFileProvider(typeof(FormHelperHtmlHelpers).GetTypeInfo().Assembly));
            });

            services.AddMvc()
                .AddFluentValidation();

            return services;
        }

        public static void AddValidator<T1, T2>(this IServiceCollection services) where T1 : class where T2 : class
        {
            services.AddTransient(typeof(IValidator<T1>), typeof(T2));
        }
    }
}
