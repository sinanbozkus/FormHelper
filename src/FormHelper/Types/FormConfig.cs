using Microsoft.AspNetCore.Mvc.Rendering;

namespace FormHelper
{
    public class FormConfig
    {
        public FormConfig(ViewContext context)
        {
            ViewContext = context;
        }

        public ViewContext ViewContext { get; private set; }
        public string FormId { get; set; }
        public FormDataType DataType { get; set; } = FormDataType.FormData;
        public string FormTitle { get; set; }
        public string BeforeSubmit { get; set; }
        public string Callback { get; set; }
        public bool EnableButtonAfterSuccess { get; set; } = false;
        public bool ResetFormAfterSuccess { get; set; } = true;
        public ToastrPosition? ToastrPosition { get; set; }
    }
}
