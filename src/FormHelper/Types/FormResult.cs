using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace FormHelper
{
    /// <summary>
    /// The response FormHelper's client script understands. Return it from an action or a Razor Page handler.
    /// It writes its own JSON (always camelCase), so it works the same whatever serializer the application uses.
    /// </summary>
    public class FormResult : IActionResult
    {
        public FormResult(FormResultStatus status)
        {
            Status = status;
        }

        [JsonPropertyName("status")]
        public FormResultStatus Status { get; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("redirectUri")]
        public string? RedirectUri { get; set; }

        [JsonPropertyName("redirectDelay")]
        public int? RedirectDelay { get; set; }

        [JsonPropertyName("object")]
        public object? Object { get; set; }

        [JsonPropertyName("validationErrors")]
        public List<FormResultValidationError>? ValidationErrors { get; set; }

        [JsonPropertyName("isSucceed")]
        public bool IsSucceed => Status == FormResultStatus.Success || Status == FormResultStatus.Info;

        /// <summary>
        /// HTTP status code of the response. The client script reads the body for any status code.
        /// </summary>
        [JsonIgnore]
        public int StatusCode { get; set; } = 200;

        public async Task ExecuteResultAsync(ActionContext context)
        {
            var httpContext = context.HttpContext;
            var options = httpContext.RequestServices?.GetService<IOptions<FormHelperOptions>>()?.Value.JsonSerializerOptions
                ?? DefaultJsonSerializerOptions;

            httpContext.Response.StatusCode = StatusCode;
            httpContext.Response.ContentType = "application/json; charset=utf-8";

            await JsonSerializer.SerializeAsync(httpContext.Response.Body, this, GetType(), options, httpContext.RequestAborted);
        }

        public static JsonSerializerOptions CreateDefaultJsonSerializerOptions()
        {
            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DictionaryKeyPolicy = JsonNamingPolicy.CamelCase
            };
#if NET5_0_OR_GREATER
            options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
#else
            options.IgnoreNullValues = true;
#endif
            return options;
        }

        private static readonly JsonSerializerOptions DefaultJsonSerializerOptions = CreateDefaultJsonSerializerOptions();

        private const string InvalidValueMessage = "The value is not valid.";

        #region - Helper Methods

        public static FormResult CreateResult(FormResultStatus status, string? message, string? redirectUri = null,
            int? redirectDelay = null)
        {
            return new FormResult(status)
            {
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            };
        }

        public static FormResult CreateResultWithObject(FormResultStatus status, object? @object, string? message = null,
            string? redirectUri = null, int? redirectDelay = null)
        {
            return new FormResult(status)
            {
                Object = @object,
                Message = message,
                RedirectUri = redirectUri,
                RedirectDelay = redirectDelay
            };
        }

        public static FormResult CreateSuccessResult(string? message, string? redirectUri = null,
            int? redirectDelay = null)
            => CreateResult(FormResultStatus.Success, message, redirectUri, redirectDelay);

        public static FormResult CreateSuccessResultWithObject(object? @object, string? message = null,
            string? redirectUri = null, int? redirectDelay = null)
            => CreateResultWithObject(FormResultStatus.Success, @object, message, redirectUri, redirectDelay);

        public static FormResult CreateWarningResult(string? message, string? redirectUri = null,
            int? redirectDelay = null)
            => CreateResult(FormResultStatus.Warning, message, redirectUri, redirectDelay);

        public static FormResult CreateWarningResultWithObject(object? @object, string? message = null,
            string? redirectUri = null, int? redirectDelay = null)
            => CreateResultWithObject(FormResultStatus.Warning, @object, message, redirectUri, redirectDelay);

        public static FormResult CreateInfoResult(string? message, string? redirectUri = null, int? redirectDelay = null)
            => CreateResult(FormResultStatus.Info, message, redirectUri, redirectDelay);

        public static FormResult CreateInfoResultWithObject(object? @object, string? message = null,
            string? redirectUri = null, int? redirectDelay = null)
            => CreateResultWithObject(FormResultStatus.Info, @object, message, redirectUri, redirectDelay);

        public static FormResult CreateErrorResult(string? message, string? redirectUri = null, int? redirectDelay = null)
            => CreateResult(FormResultStatus.Error, message, redirectUri, redirectDelay);

        public static FormResult CreateErrorResultWithObject(object? @object, string? message = null,
            string? redirectUri = null, int? redirectDelay = null)
            => CreateResultWithObject(FormResultStatus.Error, @object, message, redirectUri, redirectDelay);

        /// <summary>
        /// Creates an error result from the model state, so the client shows each message under its field.
        /// Useful when you validate manually, e.g. <c>return FormResult.CreateValidationErrorResult(ModelState);</c>
        /// Model-level errors (empty key) become the result message.
        /// </summary>
        public static FormResult CreateValidationErrorResult(ModelStateDictionary modelState, string? message = null)
        {
            var result = new FormResult(FormResultStatus.Error)
            {
                Message = message,
                ValidationErrors = new List<FormResultValidationError>()
            };

            foreach (var entry in modelState)
            {
                if (entry.Value.Errors.Count == 0)
                {
                    continue;
                }

                // Errors that only carry an exception (e.g. unreadable request body) get a generic message,
                // exception messages may expose internals.
                var messages = entry.Value.Errors
                    .Select(e => string.IsNullOrEmpty(e.ErrorMessage) ? InvalidValueMessage : e.ErrorMessage)
                    .Distinct()
                    .ToList();

                if (entry.Key.Length == 0 && result.Message == null)
                {
                    result.Message = string.Join("\n", messages);
                }

                result.ValidationErrors.Add(new FormResultValidationError
                {
                    PropertyName = entry.Key,
                    Messages = messages
                });
            }

            return result;
        }

        #endregion
    }

    public class FormResultValidationError
    {
        /// <summary>
        /// The model state key, e.g. "Title" or "Address.City". Empty for model-level errors.
        /// </summary>
        [JsonPropertyName("propertyName")]
        public string PropertyName { get; set; } = "";

        [JsonPropertyName("messages")]
        public List<string> Messages { get; set; } = new List<string>();
    }
}
