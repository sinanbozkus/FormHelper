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
        public string FormTitle { get; set; }
        public string Callback { get; set; }
    }
}
