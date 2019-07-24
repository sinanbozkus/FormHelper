using Microsoft.AspNetCore.Mvc.Rendering;
using System;

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
    }
}
