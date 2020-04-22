using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using System.Reflection;

namespace FormHelper
{
    public static class ApplicationBuilderExtensions
    {
        public static IApplicationBuilder UseFormHelper(this IApplicationBuilder app)
        {
            var assembly = typeof(ApplicationBuilderExtensions).GetTypeInfo().Assembly;

            var embededFileProviderStyles = new EmbeddedFileProvider(
                assembly,
                "FormHelper.Styles"
            );

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = embededFileProviderStyles,
                RequestPath = new PathString("/formhelper"),
            });

            var embededFileProviderScripts = new EmbeddedFileProvider(
                assembly,
                "FormHelper.Scripts"
            );

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = embededFileProviderScripts,
                RequestPath = new PathString("/formhelper"),
            });

            return app;
        }
    }
}
