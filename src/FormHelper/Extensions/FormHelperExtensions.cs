using Microsoft.AspNetCore.Http;
using System;
using System.Text;

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

        //private static bool IsMobileDevice(this HttpRequest request)
        //{
        //    return request.Headers["User-Agent"].ToString().ToLower().Contains("mobi");
        //}

        public static string GenerateCoupon(int length)
        {
            Random random = new Random();
            string characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            StringBuilder result = new StringBuilder(length);
            for (int i = 0; i < length; i++)
            {
                result.Append(characters[random.Next(characters.Length)]);
            }
            return result.ToString();
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
                    return "formhelper-toast-bottom-full-width";
                case ToastrPosition.BottomCenter:
                    return "formhelper-toast-bottom-center";
                default:
                    return "formhelper-toast-top-right";
            }
        }
    }
}
