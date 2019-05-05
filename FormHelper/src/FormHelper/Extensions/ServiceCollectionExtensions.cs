using FluentValidation;
using FluentValidation.AspNetCore;
using FormHelper.Interfaces;
using FormHelper.Services;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using System.Reflection;

namespace FormHelper.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddFormHelper(this IServiceCollection services)
        {
            services.AddScoped<IViewRenderService, ViewRenderService>();

            services.Configure<RazorViewEngineOptions>(options =>
            {
                options.FileProviders.Add(
                    new EmbeddedFileProvider(typeof(Helpers.HtmlHelpers).GetTypeInfo().Assembly));
            });

            services.AddMvc()
                .AddFluentValidation();

            return services;
        }

        public static void AddFluentValidator<T1, T2>(this IServiceCollection services) where T1 : class where T2 : class
        {
            services.AddTransient(typeof(IValidator<T1>), typeof(T2));
        }
    }
}
