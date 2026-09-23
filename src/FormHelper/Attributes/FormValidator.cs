using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FormHelper
{
    /// <summary>
    /// Validates FormHelper form posts and returns the validation errors to the client.
    /// MVC: put it on an action or a controller. Razor Pages: put it on the PageModel class
    /// (Razor Pages don't support filters on handler methods). GET/HEAD requests are not affected.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public class FormValidator : Attribute, IAsyncActionFilter, IAsyncPageFilter, IOrderedFilter
    {
        public bool ValidateAntiforgeryToken { get; set; } = true;

        /// <summary>
        /// true (default): the form is posted by FormHelper's script and errors are returned as JSON.
        /// false: a normal (full page) post; when the model is invalid the view/page is rendered again with the errors.
        /// </summary>
        public bool UseAjax { get; set; } = true;

        /// <summary>
        /// MVC only, when <see cref="UseAjax"/> is false: the view to render when the model is invalid.
        /// </summary>
        public string? ViewName { get; set; }

        public int Order { get; set; }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (IsSafeMethod(context.HttpContext.Request.Method))
            {
                await next();
                return;
            }

            var models = GetActionModels(context);

            var result = await ValidateAsync(context.HttpContext, context.ModelState, models);

            if (result == null && !UseAjax && !context.ModelState.IsValid)
            {
                result = CreateViewResult(context, models.Select(m => m.Model).FirstOrDefault());
            }

            if (result != null)
            {
                context.Result = result;
                return;
            }

            var executed = await next();

            if (UseAjax && ToFormResult(executed, executed.Result) is FormResult redirect)
            {
                executed.Result = redirect;
            }
        }

        public Task OnPageHandlerSelectionAsync(PageHandlerSelectedContext context) => Task.CompletedTask;

        public async Task OnPageHandlerExecutionAsync(PageHandlerExecutingContext context, PageHandlerExecutionDelegate next)
        {
            if (IsSafeMethod(context.HttpContext.Request.Method))
            {
                await next();
                return;
            }

            var models = GetPageModels(context);

            var result = await ValidateAsync(context.HttpContext, context.ModelState, models);

            if (result == null && !UseAjax && !context.ModelState.IsValid)
            {
                result = new PageResult();
            }

            if (result != null)
            {
                context.Result = result;
                return;
            }

            var executed = await next();

            if (UseAjax && ToFormResult(executed, executed.Result) is FormResult redirect)
            {
                executed.Result = redirect;
            }
        }

        /// <summary>
        /// Returns a result when the request must be short-circuited, null to continue.
        /// </summary>
        private async Task<IActionResult?> ValidateAsync(HttpContext httpContext, ModelStateDictionary modelState, List<BoundModel> models)
        {
            var services = httpContext.RequestServices;

            if (UseAjax && !httpContext.Request.IsFormHelperRequest())
            {
                return new ContentResult
                {
                    Content = "FormHelper: this endpoint expects a request sent by the FormHelper script. Make sure formhelper.js is loaded on the page, or use [FormValidator(UseAjax = false)] for normal form posts.",
                    ContentType = "text/plain; charset=utf-8",
                    StatusCode = StatusCodes.Status400BadRequest
                };
            }

            if (ValidateAntiforgeryToken)
            {
                var antiforgery = services.GetRequiredService<IAntiforgery>();

                if (!await antiforgery.IsRequestValidAsync(httpContext))
                {
                    if (!UseAjax)
                    {
                        return new BadRequestResult();
                    }

                    return new FormResult(FormResultStatus.Error)
                    {
                        Message = services.GetFormHelperMessage(o => o.InvalidRequestMessage),
                        StatusCode = StatusCodes.Status400BadRequest
                    };
                }
            }

            var validators = services.GetServices<IFormModelValidator>().ToList();

            if (validators.Count > 0)
            {
                foreach (var model in models)
                {
                    var validationContext = new FormModelValidationContext(httpContext, modelState, model.Model, model.Prefix);

                    foreach (var validator in validators)
                    {
                        await validator.ValidateAsync(validationContext);
                    }
                }
            }

            if (UseAjax && !modelState.IsValid)
            {
                return FormResult.CreateValidationErrorResult(modelState);
            }

            return null;
        }

        /// <summary>
        /// fetch follows a redirect by itself and would get the next page's html instead of a FormResult.
        /// So RedirectToAction, RedirectToPage, Redirect... become a FormResult the script navigates with.
        /// </summary>
        private static FormResult? ToFormResult(ActionContext context, IActionResult? result)
        {
            var url = GetRedirectUrl(context, result);

            if (url == null)
            {
                return null;
            }

            // A redirect keeps the TempData values read in this request for the next one. SaveTempDataFilter would do
            // it for IKeepTempDataResult, but it can save TempData as soon as the response starts, which a FormResult
            // does while it is being written; so they are kept here.
            context.HttpContext.RequestServices.GetService<ITempDataDictionaryFactory>()?.GetTempData(context.HttpContext).Keep();

            return new RedirectFormResult(url);
        }

        // Resolves the url like the redirect results' executors do. null: not a redirect, or it can't be resolved
        // (then the result runs as usual and reports its own error). Redirects that keep the method (307/308,
        // e.g. RedirectToActionPreserveMethod) are left to fetch, which repeats the request with the same method and body.
        private static string? GetRedirectUrl(ActionContext context, IActionResult? result)
        {
            IUrlHelper UrlHelper(IUrlHelper? own) =>
                own ?? context.HttpContext.RequestServices.GetRequiredService<IUrlHelperFactory>().GetUrlHelper(context);

            switch (result)
            {
                case RedirectResult redirect when !redirect.PreserveMethod:
                    var helper = UrlHelper(redirect.UrlHelper);
                    return helper.IsLocalUrl(redirect.Url) ? helper.Content(redirect.Url) : redirect.Url;

                case LocalRedirectResult localRedirect when !localRedirect.PreserveMethod:
                    var localHelper = UrlHelper(localRedirect.UrlHelper);
                    return localHelper.IsLocalUrl(localRedirect.Url) ? localHelper.Content(localRedirect.Url) : null;

                case RedirectToActionResult toAction when !toAction.PreserveMethod:
                    return UrlHelper(toAction.UrlHelper).Action(toAction.ActionName, toAction.ControllerName, toAction.RouteValues,
                        protocol: null, host: null, fragment: toAction.Fragment);

                case RedirectToRouteResult toRoute when !toRoute.PreserveMethod:
                    return UrlHelper(toRoute.UrlHelper).RouteUrl(toRoute.RouteName, toRoute.RouteValues,
                        protocol: null, host: null, fragment: toRoute.Fragment);

                case RedirectToPageResult toPage when !toPage.PreserveMethod:
                    return UrlHelper(toPage.UrlHelper).Page(toPage.PageName, toPage.PageHandler, toPage.RouteValues,
                        toPage.Protocol, toPage.Host, toPage.Fragment);

                default:
                    return null;
            }
        }

        private IActionResult CreateViewResult(ActionExecutingContext context, object? model)
        {
            if (context.Controller is Controller controller)
            {
                return controller.View(ViewName, model);
            }

            var metadataProvider = context.HttpContext.RequestServices.GetRequiredService<IModelMetadataProvider>();

            return new ViewResult
            {
                ViewName = ViewName,
                ViewData = new ViewDataDictionary(metadataProvider, context.ModelState) { Model = model }
            };
        }

        private static List<BoundModel> GetActionModels(ActionExecutingContext context)
        {
            var models = new List<BoundModel>();

            foreach (var parameter in context.ActionDescriptor.Parameters)
            {
                if (context.ActionArguments.TryGetValue(parameter.Name, out var value) && IsComplexModel(value))
                {
                    models.Add(new BoundModel(value!, GetPrefix(context.ModelState, parameter.Name, parameter.BindingInfo)));
                }
            }

            return models;
        }

        private static List<BoundModel> GetPageModels(PageHandlerExecutingContext context)
        {
            var models = new List<BoundModel>();

            foreach (var property in context.ActionDescriptor.BoundProperties)
            {
                if (property is PageBoundPropertyDescriptor pageProperty)
                {
                    var value = pageProperty.Property.GetValue(context.HandlerInstance);

                    if (IsComplexModel(value))
                    {
                        models.Add(new BoundModel(value!, GetPrefix(context.ModelState, property.Name, property.BindingInfo)));
                    }
                }
            }

            if (context.HandlerMethod != null)
            {
                foreach (var parameter in context.HandlerMethod.Parameters)
                {
                    if (context.HandlerArguments.TryGetValue(parameter.Name, out var value) && IsComplexModel(value))
                    {
                        models.Add(new BoundModel(value!, GetPrefix(context.ModelState, parameter.Name, parameter.BindingInfo)));
                    }
                }
            }

            return models;
        }

        // Model binding falls back to an empty prefix when no posted key starts with the parameter/property name.
        private static string GetPrefix(ModelStateDictionary modelState, string name, BindingInfo? bindingInfo)
        {
            if (!string.IsNullOrEmpty(bindingInfo?.BinderModelName))
            {
                return bindingInfo!.BinderModelName!;
            }

            foreach (var key in modelState.Keys)
            {
                if (key.StartsWith(name, StringComparison.OrdinalIgnoreCase) &&
                    (key.Length == name.Length || key[name.Length] == '.' || key[name.Length] == '['))
                {
                    return name;
                }
            }

            return "";
        }

        private static bool IsComplexModel(object? value)
        {
            if (value == null)
            {
                return false;
            }

            var type = value.GetType();

            return !(type.IsPrimitive || type.IsEnum || value is string || value is decimal || value is DateTime ||
                     value is DateTimeOffset || value is TimeSpan || value is Guid || value is IFormFile ||
                     value is IFormFileCollection || value is System.Threading.CancellationToken);
        }

        private static bool IsSafeMethod(string method)
        {
            return HttpMethods.IsGet(method) || HttpMethods.IsHead(method) ||
                   HttpMethods.IsOptions(method) || HttpMethods.IsTrace(method);
        }

        private readonly struct BoundModel
        {
            public BoundModel(object model, string prefix)
            {
                Model = model;
                Prefix = prefix;
            }

            public object Model { get; }

            public string Prefix { get; }
        }
    }

    /// <summary>
    /// A redirect sent as a FormResult. Marked like the redirect results (IKeepTempDataResult) for code that checks it.
    /// </summary>
    internal sealed class RedirectFormResult : FormResult, IKeepTempDataResult
    {
        public RedirectFormResult(string url) : base(FormResultStatus.Success)
        {
            RedirectUri = url;
        }
    }
}
