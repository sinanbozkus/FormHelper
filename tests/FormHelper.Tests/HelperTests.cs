using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Localization;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Xunit;

namespace FormHelper.Tests
{
    public class HelperTests
    {
        [Fact]
        public void Render_form_script_escapes_values_and_needs_no_jquery()
        {
            var services = new ServiceCollection();
            services.AddFormHelper(o => o.CheckTheFormFieldsMessage = "Check \"the\" fields </script><script>alert(1)</script>");

            var viewContext = new ViewContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() }
            };

            var script = FormHelperHtmlHelpers.RenderFormScript(null!, new FormConfig(viewContext)
            {
                FormId = "product-form",
                Callback = "app.forms.saved"
            }).Value!;

            Assert.StartsWith("<script>", script);
            Assert.Equal(1, CountOf(script, "</script>"));
            Assert.DoesNotContain("$(", script);
            Assert.Contains("\"product-form\"", script);
            Assert.Contains("data-fh-callback", script);
        }

        [Fact]
        public void Top_center_position_maps_to_its_own_class()
        {
            Assert.Equal("formhelper-toast-top-center", ToastrPosition.TopCenter.ToClassName());
        }

        [Fact]
        public void Form_attributes_use_data_prefix_and_lowercase_values()
        {
            var attributes = new FormHelperAttributes
            {
                DataType = FormDataType.Json,
                RedirectDelay = 2000,
                EnableButtonAfterSuccess = true,
                Validation = ClientValidation.BuiltIn
            }.ToDictionary();

            Assert.True(attributes.ContainsKey("data-formhelper"));
            Assert.Equal("json", attributes["data-fh-data-type"]);
            Assert.Equal("2000", attributes["data-fh-redirect-delay"]);
            Assert.Equal("true", attributes["data-fh-enable-button-after-success"]);
            Assert.Equal("builtin", attributes["data-fh-validation"]);
            Assert.False(attributes.ContainsKey("data-fh-callback"));
            Assert.False(attributes.ContainsKey("data-fh-input-error-class"));
        }

        [Fact]
        public void Error_css_classes_from_options_are_written_to_the_form()
        {
            var attributes = FormHelperAttributes.FromOptions(new FormHelperOptions
            {
                InputErrorCssClass = "is-invalid",
                MessageErrorCssClass = "text-sm text-red-600"
            }).ToDictionary();

            Assert.Equal("is-invalid", attributes["data-fh-input-error-class"]);
            Assert.Equal("text-sm text-red-600", attributes["data-fh-message-error-class"]);
        }

        [Fact]
        public void Messages_are_written_to_the_form_and_localized()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IStringLocalizerFactory, PrefixLocalizerFactory>();
            services.AddFormHelper(o =>
            {
                o.ErrorMessage = "Something went wrong.";
                o.LocalizationResourceType = typeof(HelperTests);
            });

            var viewContext = new ViewContext
            {
                HttpContext = new DefaultHttpContext { RequestServices = services.BuildServiceProvider() }
            };

            var script = FormHelperHtmlHelpers.RenderFormScript(null!, new FormConfig(viewContext) { FormId = "f" }).Value!;

            Assert.Contains("\"data-fh-error-message\":\"tr: Something went wrong.\"", script);
            Assert.Contains("\"data-fh-check-message\":\"tr: Check the form fields.\"", script);
        }

        [Fact]
        public void Error_message_has_a_default()
        {
            Assert.Equal("An error occurred. Please try again.", new FormHelperOptions().ErrorMessage);
        }

        // Translates by prefixing the key with "tr: ".
        private sealed class PrefixLocalizerFactory : IStringLocalizerFactory, IStringLocalizer
        {
            public IStringLocalizer Create(Type resourceSource) => this;

            public IStringLocalizer Create(string baseName, string location) => this;

            public LocalizedString this[string name] => new LocalizedString(name, "tr: " + name);

            public LocalizedString this[string name, params object[] arguments] => this[name];

            public IEnumerable<LocalizedString> GetAllStrings(bool includeParentCultures) => Enumerable.Empty<LocalizedString>();
#if NETCOREAPP3_1
            public IStringLocalizer WithCulture(CultureInfo culture) => this;
#endif
        }

        private static int CountOf(string text, string value)
        {
            var count = 0;
            for (var i = text.IndexOf(value, System.StringComparison.Ordinal); i >= 0; i = text.IndexOf(value, i + 1, System.StringComparison.Ordinal))
            {
                count++;
            }

            return count;
        }
    }
}
