using Microsoft.AspNetCore.Http;
using System;

namespace FormHelper
{
    internal static class FormHelperExtensions
    {
        public static bool IsAjaxRequest(this HttpRequest request)
        {
            if (request == null)
                throw new ArgumentNullException("request");

            if (request.Headers != null)
                return request.Headers["X-Requested-With"] == "XMLHttpRequest";

            return false;
        }

        public static bool IsMobileDevice(this HttpRequest request)
        {
            return request.Headers["User-Agent"].ToString().ToLower().Contains("mobi");
        }
    }
}
