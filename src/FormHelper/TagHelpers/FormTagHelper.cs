using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.Tasks;

namespace FormHelper
{
    [HtmlTargetElement("form", Attributes = "asp-formhelper")]
    [HtmlTargetElement("formhelper")]
    public class FormHelperTagHelper : FormTagHelper
    {

        public FormHelperTagHelper(IHtmlGenerator generator) : base(generator)
        {
        }


        [HtmlAttributeName("asp-formhelper")]
        public bool FormHelperAttribute { get; set; }

        [HtmlAttributeName("asp-callback")]
        public string Callback { get; set; }

        [HtmlAttributeName("asp-beforeSubmit")]
        public string BeforeSubmit { get; set; }

        [HtmlAttributeName("asp-dataType")]
        public FormDataType DataType { get; set; } = FormDataType.FormData;

        [HtmlAttributeName("asp-enableButtonAfterSuccess")]
        public bool EnableButtonAfterSuccess { get; set; } = false;

        [HtmlAttributeName("asp-resetFormAfterSuccess")]
        public bool ResetFormAfterSuccess { get; set; } = true;

        [HtmlAttributeName("asp-toastrPosition")]
        public ToastrPosition? ToastrPosition { get; set; }

        public async override Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            var usedFormHelperTag = output.TagName == "formhelper";

            if (usedFormHelperTag)
            {
                output.TagName = "form";
            }
            else
            {
                if (FormHelperAttribute == false)
                {
                    return;
                }
            }

            var configuration = ViewContext.HttpContext.RequestServices.GetService<FormHelperOptions>();

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

            if (ToastrPosition == null)
            {
                output.Attributes.Add("toastrPositionClass", configuration.ToastrDefaultPosition.ToClassName());
            }
            else
            {
                output.Attributes.Add("toastrPositionClass", ToastrPosition.Value.ToClassName());
            }

            output.Attributes.Add("enableButtonAfterSuccess", EnableButtonAfterSuccess);
            output.Attributes.Add("formhelper", null);
            output.Attributes.Add("resetFormAfterSuccess", ResetFormAfterSuccess);
            output.Attributes.Add("checkTheFormFieldsMessage", configuration.CheckTheFormFieldsMessage);

            if (usedFormHelperTag)
            {
                await base.ProcessAsync(context, output);
            }
        }
    }
}