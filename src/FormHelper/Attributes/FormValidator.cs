using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace FormHelper
{
	[AttributeUsage(AttributeTargets.Method)]
	public class FormValidator : ActionFilterAttribute
	{
		public bool ValidateAntiforgeryToken { get; set; } = true;
		public bool UseAjax { get; set; } = true;
		public string ViewName { get; set; }


		public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
		{
			var httpContext = context.HttpContext;

			var antiForgery = httpContext.RequestServices.GetService<IAntiforgery>();
			if (ValidateAntiforgeryToken)
			{
				await antiForgery.ValidateRequestAsync(httpContext);
			}

			await base.OnActionExecutionAsync(context, next);
		}

		public override void OnActionExecuting(ActionExecutingContext context)
		{
			var httpContext = context.HttpContext;
			var modelState = context.ModelState;


			if (UseAjax)
			{
				if (!httpContext.Request.IsAjaxRequest())
				{
					context.Result = new ContentResult()
					{
						Content = "The request is not in the expected format. Check jQuery is loaded!",
						StatusCode = StatusCodes.Status400BadRequest
					};

					return;
				}

				if (!modelState.IsValid)
				{
					var errorModel =
						from x in modelState.Keys
						where modelState[x].Errors.Count > 0
						select new
						{
							key = x,
							errors = modelState[x].Errors.
								Select(y => WebUtility.HtmlEncode(y.ErrorMessage)).
								ToArray()
						};

					var formResult = new FormResult(FormResultStatus.Error)
					{
						ValidationErrors = new List<FormResultValidationError>()
					};

					foreach (var propertyError in errorModel)
					{
						if (propertyError.key == "")
						{
							foreach (var error in propertyError.errors)
							{
								formResult.Message += error;

								if (propertyError.errors.Length > 1 && error != propertyError.errors.Last())
									formResult.Message += "<br>";
							}

							continue;
						}

						var errorMessage = new StringBuilder();

						foreach (var error in propertyError.errors)
						{
							errorMessage.Append(error);

							if (propertyError.errors.Length > 1 && error != propertyError.errors.Last())
								errorMessage.Append("<br>");
						}

						formResult.ValidationErrors.Add(new FormResultValidationError
						{
							PropertyName = propertyError.key,
							Message = errorMessage.ToString()
						});
					}

					context.Result = new JsonResult(formResult);
				}
			}
			else
			{
				var services = httpContext.RequestServices;

				var metadataProvider = services.GetService<IModelMetadataProvider>();

				var currentModel = context.ActionArguments.Values
					.Where(v => !v.GetType().FullName.StartsWith("System."))
					.FirstOrDefault();

				var viewResult = new ViewResult
				{
					ViewData = new ViewDataDictionary(metadataProvider, modelState)
				};

				if (!string.IsNullOrWhiteSpace(ViewName))
				{
					viewResult.ViewName = ViewName;  // "Index"; "../HomeTest/Index"
				}

				viewResult.ViewData.Model = currentModel;

				context.Result = viewResult;
			}

			base.OnActionExecuting(context);
		}

		public override void OnActionExecuted(ActionExecutedContext context)
		{
			base.OnActionExecuted(context);
		}
	}
}
