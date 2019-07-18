using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;

namespace FormHelper
{
    public static class FormHelperHtmlHelpers
    {
        public static async Task<HtmlString> RenderFormScript(this IHtmlHelper html, FormConfig config)
        {
            return await GetFormScript(config);
        }

        public static async Task<HtmlString> GetFormScript(FormConfig config)
        {
            var viewRenderHelper = config.ViewContext.HttpContext.RequestServices.GetService<IFormHelperViewRenderService>();
            var configuration = config.ViewContext.HttpContext.RequestServices.GetService<FormHelperConfiguration>();

            var model = new RenderFormScriptModel
            {
                FormId = config.FormId,
                Callback = config.Callback,
                BeforeSubmit = config.BeforeSubmit,
                IsMobileDevice = config.ViewContext.HttpContext.Request.IsMobileDevice()
            };

            var result = await viewRenderHelper.RenderToStringAsync("RenderFormScript", model);

            if (!configuration.DebugMode)
            {
                result = result.Replace("\r", "").Replace("\n", "").Replace("  ", "");
            }

            return new HtmlString(result);
        }
    }
}
