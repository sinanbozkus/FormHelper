using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.DependencyInjection;

namespace FormHelper
{
    public static class FormHelperHtmlHelpers
    {
        public static HtmlString RenderFormScript(this IHtmlHelper html, FormConfig config)
        {
            var configuration = config.ViewContext.HttpContext.RequestServices.GetService<FormHelperConfiguration>();

            return new HtmlString($@"
                            <script>
                                $(document).ready(function () {{
                                    var $form = $('#{config.FormId}');
                                    $('#{config.FormId}').UseFormHelper({{
                                        url: $form.attr('action'),
                                        method: $form.attr('method'),
                                        dataType: '{config.DataType}',
                                        redirectDelay: {configuration.RedirectDelay},
                                        beforeSubmit: '{config.BeforeSubmit}',
                                        callback: '{config.Callback}',
                                        enableButtonAfterSuccess: {(config.EnableButtonAfterSuccess ? "true" : "false")},
                                        resetFormAfterSuccess: {(config.ResetFormAfterSuccess ? "true" : "false")},
                                        checkTheFormFieldsMessage: '{configuration.CheckTheFormFieldsMessage}',
                                        toastrPositionClass: '{(config.ToastrPosition == null ? configuration.ToastrDefaultPosition.ToClassName() : config.ToastrPosition.Value.ToClassName())}'
                                    }});
                                }});
                            </script>
                            ");
        }
    }
}
