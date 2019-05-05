using FormHelper.Enums;
using System.Collections.Generic;

namespace FormHelper.Types
{
    public class FormResult
    {
        public FormResultStatus Status { get; set; }
        public string Message { get; set; }
        public string RedirectUri { get; set; }
        public object Object { get; set; }
        public List<FormResultValidationError> ValidationErrors { get; set; }

        public bool IsSucceed => Status == FormResultStatus.Success;
    }

    public class FormResultValidationError
    {
        public string PropertyName { get; set; }
        public string Message { get; set; }
    }
}
