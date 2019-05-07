using System.Threading.Tasks;

namespace FormHelper
{
    interface IFormHelperViewRenderService
    {
        Task<string> RenderToStringAsync(string viewName, object model);
    }
}
