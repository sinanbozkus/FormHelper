using FormHelper.Enums;
using Microsoft.AspNetCore.Mvc;
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


        #region - Helper Methods

        public static JsonResult CreateSuccessResult(string message)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Success,
                Message = message
            });
        }

        public static JsonResult CreateWarningResult(string message)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Warning,
                Message = message
            });
        }

        public static JsonResult CreateInfoResult(string message)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Info,
                Message = message
            });
        }

        public static JsonResult CreateErrorResult(string message)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Error,
                Message = message
            });
        }

        #endregion
    }

    public class FormResultValidationError
    {
        public string PropertyName { get; set; }
        public string Message { get; set; }
    }
}
