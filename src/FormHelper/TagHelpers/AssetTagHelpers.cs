using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using System;
using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace FormHelper
{
    /// <summary>
    /// &lt;formhelper-scripts /&gt; renders the script tag for FormHelper's embedded script (requires app.UseFormHelper()).
    /// </summary>
    [HtmlTargetElement("formhelper-scripts", TagStructure = TagStructure.WithoutEndTag)]
    public class FormHelperScriptsTagHelper : TagHelper
    {
        /// <summary>
        /// true: formhelper.bundle.js, which also contains jQuery Validation and jQuery Validation Unobtrusive
        /// (jQuery must be loaded first). They are skipped when the page already has them.
        /// false (default): formhelper.js, works with or without jQuery.
        /// </summary>
        [HtmlAttributeName("bundle")]
        public bool Bundle { get; set; }

        [HtmlAttributeName("minified")]
        public bool Minified { get; set; } = true;

        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; } = default!;

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            var file = (Bundle ? "formhelper.bundle" : "formhelper") + (Minified ? ".min.js" : ".js");

            output.TagName = "script";
            output.TagMode = TagMode.StartTagAndEndTag;
            output.Attributes.SetAttribute("src", AssetUrl.Get(ViewContext, file));
        }
    }

    /// <summary>
    /// &lt;formhelper-styles /&gt; renders the link tag for FormHelper's embedded styles (requires app.UseFormHelper()).
    /// </summary>
    [HtmlTargetElement("formhelper-styles", TagStructure = TagStructure.WithoutEndTag)]
    public class FormHelperStylesTagHelper : TagHelper
    {
        [HtmlAttributeName("minified")]
        public bool Minified { get; set; } = true;

        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; } = default!;

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "link";
            output.TagMode = TagMode.SelfClosing;
            output.Attributes.SetAttribute("rel", "stylesheet");
            output.Attributes.SetAttribute("href", AssetUrl.Get(ViewContext, Minified ? "formhelper.min.css" : "formhelper.css"));
        }
    }

    internal static class AssetUrl
    {
        private static readonly ConcurrentDictionary<string, string> Hashes = new ConcurrentDictionary<string, string>();

        // PathBase keeps the url working when the app runs under a virtual directory (e.g. an IIS sub-application).
        public static string Get(ViewContext viewContext, string file)
        {
            var hash = Hashes.GetOrAdd(file, ComputeHash);

            return $"{viewContext.HttpContext.Request.PathBase}{ApplicationBuilderExtensions.RequestPath}/{file}?v={hash}";
        }

        // The content hash changes whenever the file changes, so a cached copy is never stale.
        private static string ComputeHash(string file)
        {
            var assembly = typeof(AssetUrl).Assembly;
            var folder = file.EndsWith(".css", StringComparison.OrdinalIgnoreCase) ? "Styles" : "Scripts";

            using var stream = assembly.GetManifestResourceStream($"FormHelper.{folder}.{file}");

            if (stream == null)
            {
                throw new InvalidOperationException($"FormHelper: embedded file '{file}' was not found.");
            }

            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(stream);

            return BitConverter.ToString(bytes, 0, 6).Replace("-", "").ToLowerInvariant();
        }
    }
}
