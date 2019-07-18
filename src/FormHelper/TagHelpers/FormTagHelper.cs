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

        public async override Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            if (!output.Attributes.ContainsName("id"))
            {
                throw new ArgumentNullException("Form must have an ID");
            }

            output.TagName = "form";

            var htmlString = await FormHelperHtmlHelpers.GetFormScript(new FormConfig(ViewContext)
            {
                FormId = output.Attributes["id"].Value.ToString(),
                Callback = Callback,
                BeforeSubmit = BeforeSubmit,
            });

            output.PostElement.AppendHtml(htmlString);

            await base.ProcessAsync(context, output);
        }
    }
}
