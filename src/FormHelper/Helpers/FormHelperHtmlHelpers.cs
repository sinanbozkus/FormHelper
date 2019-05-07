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
            var viewRenderHelper = config.ViewContext.HttpContext.RequestServices.GetService<IFormHelperViewRenderService>();

            var model = new RenderFormScriptModel
            {
                FormId = config.FormId,
                Callback = config.Callback,
                IsMobileDevice = config.ViewContext.HttpContext.Request.IsMobileDevice()
            };

            var result = await viewRenderHelper.RenderToStringAsync("RenderFormScript", model);
            return new HtmlString(result);
        }
    }
}
