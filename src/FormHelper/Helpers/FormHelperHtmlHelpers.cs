using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Text.Json;

namespace FormHelper
{
    public static class FormHelperHtmlHelpers
    {
        /// <summary>
        /// Adds the FormHelper attributes to the form with <see cref="FormConfig.FormId"/>.
        /// Place it after the form. The tag helper (&lt;form asp-formhelper="true"&gt;) is the simpler alternative.
        /// </summary>
        public static HtmlString RenderFormScript(this IHtmlHelper html, FormConfig config)
        {
            var services = config.ViewContext.HttpContext.RequestServices;
            var options = services.GetFormHelperOptions();

            var attributes = FormHelperAttributes.FromOptions(options);
            attributes.DataType = config.DataType;
            attributes.Callback = config.Callback;
            attributes.BeforeSubmit = config.BeforeSubmit;
            attributes.ToastrPosition = config.ToastrPosition ?? options.ToastrDefaultPosition;
            attributes.EnableButtonAfterSuccess = config.EnableButtonAfterSuccess;
            attributes.ResetFormAfterSuccess = config.ResetFormAfterSuccess;
            attributes.CheckTheFormFieldsMessage = config.CheckTheFormFieldsMessage ?? services.Localize(options, options.CheckTheFormFieldsMessage);
            attributes.ErrorMessage = services.Localize(options, options.ErrorMessage);
            attributes.Validation = config.Validation ?? options.ClientValidation;

            // System.Text.Json escapes <, > and & by default, so the values are safe inside a script block.
            var formId = JsonSerializer.Serialize(config.FormId);
            var values = JsonSerializer.Serialize(attributes.ToDictionary());

            return new HtmlString(
                "<script>(function(){" +
                $"var f=document.getElementById({formId});if(!f)return;" +
                $"var a={values};for(var k in a)f.setAttribute(k,a[k]);" +
                "})();</script>");
        }
    }
}
