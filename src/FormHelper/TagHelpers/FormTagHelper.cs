using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;

namespace FormHelper
{
    [HtmlTargetElement("formhelper")]
    public class FormHelperTagHelper : FormTagHelper
    {

        public FormHelperTagHelper(IHtmlGenerator generator) : base(generator)
        {
        }

        [HtmlAttributeName("asp-callback")]
        public string Callback { get; set; }

        [HtmlAttributeName("asp-beforeSubmit")]
        public string BeforeSubmit { get; set; }

        [HtmlAttributeName("asp-dataType")]
        public FormDataType DataType { get; set; } = FormDataType.FormData;

        [HtmlAttributeName("asp-enableButtonAfterSuccess")]
        public bool EnableButtonAfterSuccess { get; set; } = false;

        public async override Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            var configuration = ViewContext.HttpContext.RequestServices.GetService<FormHelperConfiguration>();

            string formId;

            if (output.Attributes.ContainsName("id"))
            {
                formId = output.Attributes["id"].Value.ToString();
            }
            else
            {
                formId = $"formhelper_{FormHelperExtensions.GenerateCoupon(6)}";
                output.Attributes.Add("id", formId);
            }

            output.Attributes.Add("dataType", DataType.ToString());


            output.Attributes.Add("redirectDelay", configuration.RedirectDelay);

            if (!string.IsNullOrWhiteSpace(Callback))
            {
                output.Attributes.Add("callback", Callback);
            }

            if (!string.IsNullOrWhiteSpace(BeforeSubmit))
            {
                output.Attributes.Add("beforeSubmit", BeforeSubmit);
            }

            output.Attributes.Add("enableButtonAfterSuccess", EnableButtonAfterSuccess);
            output.Attributes.Add("checkTheFormFieldsMessage", configuration.CheckTheFormFieldsMessage);

            output.TagName = "form";

            output.PostContent.AppendHtml($"<script>$(document).ready(function () {{$('#{formId}').UseFormHelper();}});</script>");
       
            await base.ProcessAsync(context, output);
        }
    }
}
