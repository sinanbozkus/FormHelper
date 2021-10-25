using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace FormHelper
{
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy), ItemNullValueHandling = NullValueHandling.Ignore)]
    public class FormResult
    {
        public FormResult(FormResultStatus status)
        {
            Status = status;
        }
        
        public FormResultStatus Status { get; private set; } // todo: remove private => ignoreReadonlyProperties
        public string Message { get; set; }
        public string RedirectUri { get; set; }
        public int? RedirectDelay { get; set; }
        public object Object { get; set; }
        public List<FormResultValidationError> ValidationErrors { get; set; }
        public bool IsSucceed => Status == FormResultStatus.Success || Status == FormResultStatus.Info;


        #region - Helper Methods

        public static JsonResult CreateResult(FormResultStatus status, string message, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(status)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateResultWithObject(FormResultStatus status, object @object, string message = null, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(status)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateSuccessResult(string message, string redirectUri = null, int? redirectDelay = null)
        {

            return new JsonResult(new FormResult(FormResultStatus.Success)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateSuccessResultWithObject(object @object, string message = null, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Success)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay,
                Object = @object
            });
        }

        public static JsonResult CreateWarningResult(string message, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Warning)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateWarningResultWithObject(object @object, string message = null, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Warning)
            {
                Object = @object,
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateInfoResult(string message, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Info)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateInfoResultWithObject(object @object, string message = null, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Info)
            {
                Object = @object,
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateErrorResult(string message, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Error)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateErrorResultWithObject(object @object, string message = null, string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Error)
            {
                Object = @object,
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        #endregion
    }

    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
    public class FormResultValidationError
    {
        public string PropertyName { get; set; }
        public string Message { get; set; }
    }
}
