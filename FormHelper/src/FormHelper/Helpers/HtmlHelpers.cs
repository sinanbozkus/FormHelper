using FormHelper.Interfaces;
using FormHelper.Types;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;

namespace FormHelper.Helpers
{
    public static class HtmlHelpers
    {
        public static async Task<HtmlString> RenderFormScript(this IHtmlHelper html, FormConfig config)
        {
            var viewRenderHelper = config.ViewContext.HttpContext.RequestServices.GetService<IViewRenderService>();

            var result = await viewRenderHelper.RenderToStringAsync("RenderFormScript", config);
            return new HtmlString(result);
        }
    }
}
