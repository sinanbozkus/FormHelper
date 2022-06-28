using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
#if NET5_0_OR_GREATER
using System.Text.Json.Serialization;

#else
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
#endif


namespace FormHelper
{
#if !NET5_0_OR_GREATER
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy), ItemNullValueHandling = NullValueHandling.Ignore)]
#endif
    public class FormResult
    {
        public FormResult(FormResultStatus status)
        {
            Status = status;
        }

#if NET5_0_OR_GREATER
        [JsonPropertyName("status")]
#endif
        public FormResultStatus Status { get; private set; } // todo: remove private => ignoreReadonlyProperties


#if NET5_0_OR_GREATER
        [JsonPropertyName("message")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
#endif
        public string Message { get; set; }


#if NET5_0_OR_GREATER
        [JsonPropertyName("redirectUri")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
#endif
        public string RedirectUri { get; set; }


#if NET5_0_OR_GREATER
        [JsonPropertyName("redirectDelay")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
#endif
        public int? RedirectDelay { get; set; }


#if NET5_0_OR_GREATER
        [JsonPropertyName("object")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
#endif
        public object Object { get; set; }


#if NET5_0_OR_GREATER
        [JsonPropertyName("validationErrors")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
#endif
        public List<FormResultValidationError> ValidationErrors { get; set; }

        public bool IsSucceed => Status == FormResultStatus.Success || Status == FormResultStatus.Info;


        #region - Helper Methods

        public static JsonResult CreateResult(FormResultStatus status, string message, string redirectUri = null,
            int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(status)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateResultWithObject(FormResultStatus status, object @object, string message = null,
            string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(status)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateSuccessResult(string message, string redirectUri = null,
            int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Success)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateSuccessResultWithObject(object @object, string message = null,
            string redirectUri = null, int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Success)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay,
                Object = @object
            });
        }

        public static JsonResult CreateWarningResult(string message, string redirectUri = null,
            int? redirectDelay = null)
        {
            return new JsonResult(new FormResult(FormResultStatus.Warning)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            });
        }

        public static JsonResult CreateWarningResultWithObject(object @object, string message = null,
            string redirectUri = null, int? redirectDelay = null)
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

        public static JsonResult CreateInfoResultWithObject(object @object, string message = null,
            string redirectUri = null, int? redirectDelay = null)
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

        public static JsonResult CreateErrorResultWithObject(object @object, string message = null,
            string redirectUri = null, int? redirectDelay = null)
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

#if !NET5_0_OR_GREATER
    [JsonObject(NamingStrategyType = typeof(CamelCaseNamingStrategy))]
#endif
    public class FormResultValidationError
    {
#if NET5_0_OR_GREATER
        [JsonPropertyName("propertyName")]
#endif
        public string PropertyName { get; set; }
#if NET5_0_OR_GREATER
        [JsonPropertyName("message")]
#endif
        public string Message { get; set; }
    }
}