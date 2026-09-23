using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using System.Reflection;

namespace FormHelper
{
    public static class ApplicationBuilderExtensions
    {
        internal const string RequestPath = "/formhelper";

        /// <summary>
        /// Serves FormHelper's embedded scripts and styles under /formhelper/.
        /// </summary>
        public static IApplicationBuilder UseFormHelper(this IApplicationBuilder app)
        {
            var assembly = typeof(ApplicationBuilderExtensions).GetTypeInfo().Assembly;

            var fileProvider = new CompositeFileProvider(
                new EmbeddedFileProvider(assembly, "FormHelper.Scripts"),
                new EmbeddedFileProvider(assembly, "FormHelper.Styles"));

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = fileProvider,
                RequestPath = new PathString(RequestPath),
                OnPrepareResponse = context =>
                {
                    // Versioned urls (<formhelper-scripts />, <formhelper-styles />) never change, cache them for a year.
                    // Unversioned urls are revalidated so an updated package is picked up immediately.
                    context.Context.Response.Headers["Cache-Control"] = context.Context.Request.Query.ContainsKey("v")
                        ? "public, max-age=31536000, immutable"
                        : "no-cache";
                }
            });

            return app;
        }
    }
}
