using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Core.Infrastructure;
using Microsoft.AspNetCore.Mvc.Filters;

namespace FormHelper
{
    /// <summary>
    /// Razor Pages, and MVC with [AutoValidateAntiforgeryToken], check the antiforgery token before [FormValidator] runs
    /// and answer an invalid token with an empty 400. For a FormHelper request the answer becomes a FormResult with
    /// <see cref="FormHelperOptions.InvalidRequestMessage"/>, so the user knows to refresh the page.
    /// An always-run result filter also runs for results of authorization filters.
    /// </summary>
    internal sealed class InvalidAntiforgeryResultFilter : IAlwaysRunResultFilter
    {
        public void OnResultExecuting(ResultExecutingContext context)
        {
            if (context.Result is IAntiforgeryValidationFailedResult && context.HttpContext.Request.IsFormHelperRequest())
            {
                context.Result = new FormResult(FormResultStatus.Error)
                {
                    Message = context.HttpContext.RequestServices.GetFormHelperMessage(o => o.InvalidRequestMessage),
                    StatusCode = StatusCodes.Status400BadRequest
                };
            }
        }

        public void OnResultExecuted(ResultExecutedContext context)
        {
        }
    }
}
