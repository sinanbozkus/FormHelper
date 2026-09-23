using Microsoft.AspNetCore.Mvc.TagHelpers;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
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
        public string? Callback { get; set; }

        [HtmlAttributeName("asp-beforeSubmit")]
        public string? BeforeSubmit { get; set; }

        [HtmlAttributeName("asp-dataType")]
        public FormDataType DataType { get; set; } = FormDataType.FormData;

        [HtmlAttributeName("asp-enableButtonAfterSuccess")]
        public bool EnableButtonAfterSuccess { get; set; } = false;

        [HtmlAttributeName("asp-resetFormAfterSuccess")]
        public bool ResetFormAfterSuccess { get; set; } = true;

        [HtmlAttributeName("asp-toastrPosition")]
        public ToastrPosition? ToastrPosition { get; set; }

        [HtmlAttributeName("asp-checkTheFormFieldsMessage")]
        public string? CheckTheFormFieldsMessage { get; set; }

        [HtmlAttributeName("asp-validation")]
        public ClientValidation? Validation { get; set; }

        public override async Task ProcessAsync(TagHelperContext context, TagHelperOutput output)
        {
            var usedFormHelperTag = output.TagName == "formhelper";

            if (usedFormHelperTag)
            {
                output.TagName = "form";
            }
            else if (!FormHelperAttribute)
            {
                return;
            }

            var services = ViewContext.HttpContext.RequestServices;
            var options = services.GetFormHelperOptions();

            var attributes = FormHelperAttributes.FromOptions(options);
            attributes.DataType = DataType;
            attributes.Callback = Callback;
            attributes.BeforeSubmit = BeforeSubmit;
            attributes.ToastrPosition = ToastrPosition ?? options.ToastrDefaultPosition;
            attributes.EnableButtonAfterSuccess = EnableButtonAfterSuccess;
            attributes.ResetFormAfterSuccess = ResetFormAfterSuccess;
            attributes.CheckTheFormFieldsMessage = CheckTheFormFieldsMessage ?? services.Localize(options, options.CheckTheFormFieldsMessage);
            attributes.ErrorMessage = services.Localize(options, options.ErrorMessage);
            attributes.Validation = Validation ?? options.ClientValidation;

            foreach (var attribute in attributes.ToDictionary())
            {
                output.Attributes.SetAttribute(attribute.Key, attribute.Value);
            }

            if (usedFormHelperTag)
            {
                await base.ProcessAsync(context, output);
            }
        }
    }
}
