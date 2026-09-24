using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.RazorPages.Infrastructure;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace FormHelper.Tests
{
    /// <summary>
    /// Paths that need views/pages to execute are tested at the filter level.
    /// </summary>
    public class FormValidatorFilterTests
    {
        [Fact]
        public async Task Native_post_with_invalid_model_renders_the_view_again_with_the_model()
        {
            var model = new ProductModel { Title = "x" };
            var (context, controller) = CreateActionContext(model, formHelperRequest: false);
            context.ModelState.AddModelError("Title", "Too short.");

            var filter = new FormValidator { UseAjax = false, ValidateAntiforgeryToken = false, ViewName = "Post" };
            var nextCalled = false;

            await filter.OnActionExecutionAsync(context, () =>
            {
                nextCalled = true;
                return Task.FromResult(new ActionExecutedContext(context, context.Filters, controller));
            });

            Assert.False(nextCalled);
            var view = Assert.IsType<ViewResult>(context.Result);
            Assert.Equal("Post", view.ViewName);
            Assert.Same(model, view.Model);
            Assert.False(view.ViewData.ModelState.IsValid);
        }

        [Fact]
        public async Task Native_post_with_valid_model_runs_the_action()
        {
            var (context, controller) = CreateActionContext(new ProductModel { Title = "Book" }, formHelperRequest: false);
            var filter = new FormValidator { UseAjax = false, ValidateAntiforgeryToken = false };
            var nextCalled = false;

            await filter.OnActionExecutionAsync(context, () =>
            {
                nextCalled = true;
                return Task.FromResult(new ActionExecutedContext(context, context.Filters, controller));
            });

            Assert.True(nextCalled);
            Assert.Null(context.Result);
        }

        [Fact]
        public async Task Razor_page_ajax_post_with_invalid_bound_property_returns_validation_errors()
        {
            var page = new ProductPageModel { Input = new ProductModel { Title = "taken" } };
            var context = CreatePageContext(page, formHelperRequest: true);

            var filter = new FormValidator { ValidateAntiforgeryToken = false };
            var nextCalled = false;

            await filter.OnPageHandlerExecutionAsync(context, () =>
            {
                nextCalled = true;
                return Task.FromResult(new PageHandlerExecutedContext(new PageContext(context), context.Filters, context.HandlerMethod, page));
            });

            Assert.False(nextCalled);
            var result = Assert.IsType<FormResult>(context.Result);
            var error = Assert.Single(result.ValidationErrors!);
            Assert.Equal("Input.Title", error.PropertyName);
        }

        [Fact]
        public async Task Razor_page_native_post_with_invalid_model_returns_the_page()
        {
            var page = new ProductPageModel { Input = new ProductModel { Title = "taken" } };
            var context = CreatePageContext(page, formHelperRequest: false);

            var filter = new FormValidator { UseAjax = false, ValidateAntiforgeryToken = false };

            await filter.OnPageHandlerExecutionAsync(context, () =>
                Task.FromResult(new PageHandlerExecutedContext(new PageContext(context), context.Filters, context.HandlerMethod, page)));

            Assert.IsType<PageResult>(context.Result);
        }

        [Fact]
        public async Task Razor_page_redirect_becomes_a_form_result()
        {
            var page = new ProductPageModel { Input = new ProductModel { Title = "Book" } };
            var context = CreatePageContext(page, formHelperRequest: true);
            context.ModelState.MarkFieldValid("Input.Title");
            PageHandlerExecutedContext? executed = null;

            await new FormValidator { ValidateAntiforgeryToken = false }.OnPageHandlerExecutionAsync(context, () =>
            {
                executed = new PageHandlerExecutedContext(new PageContext(context), context.Filters, context.HandlerMethod, page)
                {
                    Result = new RedirectToPageResult("/Teams") { UrlHelper = new PageUrlHelper(context) }
                };
                return Task.FromResult(executed);
            });

            var result = Assert.IsAssignableFrom<FormResult>(executed!.Result);
            Assert.Equal("/Teams", result.RedirectUri);
            Assert.IsAssignableFrom<IKeepTempDataResult>(result);
        }

        private static (ActionExecutingContext, Controller) CreateActionContext(ProductModel model, bool formHelperRequest)
        {
            var httpContext = CreateHttpContext(formHelperRequest);
            var descriptor = new ControllerActionDescriptor
            {
                Parameters = new List<ParameterDescriptor>
                {
                    new ParameterDescriptor { Name = "model", ParameterType = typeof(ProductModel) }
                }
            };

            var actionContext = new ActionContext(httpContext, new RouteData(), descriptor, new ModelStateDictionary());
            var controller = new EmptyController { ControllerContext = new ControllerContext(actionContext) };

            var context = new ActionExecutingContext(actionContext, new List<IFilterMetadata>(),
                new Dictionary<string, object?> { ["model"] = model }, controller);

            return (context, controller);
        }

        private static PageHandlerExecutingContext CreatePageContext(ProductPageModel page, bool formHelperRequest)
        {
            var services = new ServiceCollection();
            services.AddSingleton<IFormModelValidator, TakenTitleValidator>();
            var httpContext = CreateHttpContext(formHelperRequest, services);

            var descriptor = new CompiledPageActionDescriptor
            {
                BoundProperties = new List<ParameterDescriptor>
                {
                    new PageBoundPropertyDescriptor
                    {
                        Name = nameof(ProductPageModel.Input),
                        ParameterType = typeof(ProductModel),
                        Property = typeof(ProductPageModel).GetProperty(nameof(ProductPageModel.Input))!
                    }
                }
            };

            var modelState = new ModelStateDictionary();
            modelState.SetModelValue("Input.Title", "taken", "taken");

            var pageContext = new PageContext(new ActionContext(httpContext, new RouteData(), descriptor, modelState));
            var handler = new HandlerMethodDescriptor
            {
                MethodInfo = typeof(ProductPageModel).GetMethod(nameof(ProductPageModel.OnPost))!,
                HttpMethod = "POST",
                Parameters = new List<HandlerParameterDescriptor>()
            };

            return new PageHandlerExecutingContext(pageContext, new List<IFilterMetadata>(), handler,
                new Dictionary<string, object?>(), page);
        }

        private static HttpContext CreateHttpContext(bool formHelperRequest, IServiceCollection? services = null)
        {
            services ??= new ServiceCollection();
            services.AddLogging();
            services.AddControllersWithViews().AddFormHelper();

            var httpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() };
            httpContext.Request.Method = "POST";

            if (formHelperRequest)
            {
                httpContext.Request.Headers["X-Requested-With"] = "XMLHttpRequest";
            }

            return httpContext;
        }

        private class EmptyController : Controller
        {
        }

        public class ProductPageModel : PageModel
        {
            public ProductModel? Input { get; set; }

            public void OnPost()
            {
            }
        }

#nullable disable
        // Generates "/{page}" (there is no routing in these tests).
        private sealed class PageUrlHelper : IUrlHelper
        {
            public PageUrlHelper(ActionContext context) => ActionContext = context;

            public ActionContext ActionContext { get; }

            public string Action(UrlActionContext actionContext) => null;

            public string Content(string contentPath) => contentPath;

            public bool IsLocalUrl(string url) => true;

            public string Link(string routeName, object values) => null;

            public string RouteUrl(UrlRouteContext routeContext) => new RouteValueDictionary(routeContext.Values)["page"] as string;
        }
#nullable restore

        private class TakenTitleValidator : IFormModelValidator
        {
            public Task ValidateAsync(FormModelValidationContext context)
            {
                if (context.Model is ProductModel product && product.Title == "taken")
                {
                    context.ModelState.AddModelError(context.GetKey(nameof(ProductModel.Title)), "This title is already taken.");
                }

                return Task.CompletedTask;
            }
        }
    }
}
