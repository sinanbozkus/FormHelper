using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System;
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

        [HtmlAttributeName("asp-beforesubmit")]
        public string BeforeSubmit { get; set; }

        [HtmlAttributeName("asp-datatype")]
        public FormDataType DataType { get; set; } = FormDataType.FormData;

        public async override Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
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

            output.TagName = "form";

            var htmlString = await FormHelperHtmlHelpers.GetFormScript(new FormConfig(ViewContext)
            {
                FormId = formId,
                DataType = DataType,
                Callback = Callback,
                BeforeSubmit = BeforeSubmit
            });

            output.PostElement.AppendHtml(htmlString);            

            await base.ProcessAsync(context, output);
        }
    }
}
