using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace FormHelper
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

        public static JsonResult CreateSuccessResult(string message, string redirectUri = null)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Success,
                Message = message,
                RedirectUri = redirectUri
            });
        }

        public static JsonResult CreateWarningResult(string message, string redirectUri = null)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Warning,
                Message = message,
                RedirectUri = redirectUri
            });
        }

        public static JsonResult CreateInfoResult(string message, string redirectUri = null)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Info,
                Message = message,
                RedirectUri = redirectUri
            });
        }

        public static JsonResult CreateErrorResult(string message, string redirectUri = null)
        {
            return new JsonResult(new FormResult
            {
                Status = FormResultStatus.Error,
                Message = message,
                RedirectUri = redirectUri
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
