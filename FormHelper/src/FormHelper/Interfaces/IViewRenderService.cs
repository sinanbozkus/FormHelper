using System.Threading.Tasks;

namespace FormHelper.Interfaces
{
    interface IViewRenderService
    {
        Task<string> RenderToStringAsync(string viewName, object model);
    }
}
