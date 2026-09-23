using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using System;

namespace FormHelper
{
    internal static class FormHelperExtensions
    {
        /// <summary>
        /// The FormHelper script sends X-Requested-With: XMLHttpRequest (like jQuery.ajax does).
        /// </summary>
        public static bool IsFormHelperRequest(this HttpRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            return request.Headers["X-Requested-With"] == "XMLHttpRequest";
        }

        public static FormHelperOptions GetFormHelperOptions(this IServiceProvider services)
        {
            return services.GetService<IOptions<FormHelperOptions>>()?.Value ?? new FormHelperOptions();
        }

        /// <summary>
        /// Returns the message, localized when <see cref="FormHelperOptions.LocalizationResourceType"/> is set.
        /// </summary>
        public static string GetFormHelperMessage(this IServiceProvider services, Func<FormHelperOptions, string> message)
        {
            var options = services.GetFormHelperOptions();

            return services.Localize(options, message(options));
        }

        public static string Localize(this IServiceProvider services, FormHelperOptions options, string message)
        {
            if (options.LocalizationResourceType == null || string.IsNullOrEmpty(message))
            {
                return message;
            }

            var factory = services.GetService<IStringLocalizerFactory>();

            if (factory == null)
            {
                return message;
            }

            return factory.Create(options.LocalizationResourceType)[message].Value;
        }

        public static string ToClassName(this ToastrPosition position)
        {
            switch (position)
            {
                case ToastrPosition.TopRight:
                    return "formhelper-toast-top-right";
                case ToastrPosition.BottomRight:
                    return "formhelper-toast-bottom-right";
                case ToastrPosition.BottomLeft:
                    return "formhelper-toast-bottom-left";
                case ToastrPosition.TopLeft:
                    return "formhelper-toast-top-left";
                case ToastrPosition.TopFullWidth:
                    return "formhelper-toast-top-full-width";
                case ToastrPosition.BottomFullWidth:
                    return "formhelper-toast-bottom-full-width";
                case ToastrPosition.TopCenter:
                    return "formhelper-toast-top-center";
                case ToastrPosition.BottomCenter:
                    return "formhelper-toast-bottom-center";
                default:
                    return "formhelper-toast-top-right";
            }
        }

        public static string ToAttributeValue(this ClientValidation validation)
        {
            switch (validation)
            {
                case ClientValidation.JQuery:
                    return "jquery";
                case ClientValidation.BuiltIn:
                    return "builtin";
                case ClientValidation.None:
                    return "none";
                default:
                    return "auto";
            }
        }

        public static string ToAttributeValue(this bool value) => value ? "true" : "false";
    }
}
