using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.TestHost;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace FormHelper.Tests
{
    public class FormValidatorMvcTests
    {
        [Fact]
        public async Task Valid_post_runs_the_action_and_returns_camel_case_json()
        {
            using var host = await TestApp.StartAsync();
            var client = host.GetTestClient();

            var response = await client.SendAsync(TestApp.Post("/forms/product", new Dictionary<string, string>
            {
                ["Title"] = "Book",
                ["InStock"] = "5"
            }));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);

            var json = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            // The app's JSON options are PascalCase; FormResult must still be camelCase.
            Assert.Equal(1, root.GetProperty("status").GetInt32());
            Assert.Equal("Saved.", root.GetProperty("message").GetString());
            Assert.Equal("/products", root.GetProperty("redirectUri").GetString());
            Assert.True(root.GetProperty("isSucceed").GetBoolean());
            Assert.False(root.TryGetProperty("validationErrors", out _));
            Assert.False(root.TryGetProperty("object", out _));
            Assert.False(root.TryGetProperty("redirectDelay", out _));
        }

        [Fact]
        public async Task Invalid_post_returns_validation_errors_as_message_arrays()
        {
            using var host = await TestApp.StartAsync();
            var client = host.GetTestClient();

            var response = await client.SendAsync(TestApp.Post("/forms/product", new Dictionary<string, string>
            {
                ["Title"] = "",
                ["InStock"] = "500"
            }));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var root = document.RootElement;

            Assert.Equal(4, root.GetProperty("status").GetInt32());
            Assert.False(root.GetProperty("isSucceed").GetBoolean());

            var errors = root.GetProperty("validationErrors").EnumerateArray()
                .ToDictionary(e => e.GetProperty("propertyName").GetString()!,
                              e => e.GetProperty("messages").EnumerateArray().Select(m => m.GetString()).ToArray());

            Assert.Equal(new[] { "Title is required." }, errors["Title"]);
            Assert.Equal(new[] { "In Stock must be between 1 and 100." }, errors["InStock"]);
        }

        [Fact]
        public async Task Messages_are_returned_as_plain_text_and_escaped_in_json()
        {
            using var host = await TestApp.StartAsync();
            var client = host.GetTestClient();

            // Model binding puts the attempted value into the message; it must not reach the page as html.
            var response = await client.SendAsync(TestApp.Post("/forms/product", new Dictionary<string, string>
            {
                ["Title"] = "Book",
                ["InStock"] = "<img src=x onerror=alert(1)>"
            }));

            var json = await response.Content.ReadAsStringAsync();

            Assert.DoesNotContain("<img", json);

            using var document = JsonDocument.Parse(json);
            var message = document.RootElement.GetProperty("validationErrors")[0].GetProperty("messages")[0].GetString();

            Assert.Contains("<img src=x onerror=alert(1)>", message);
        }

        [Fact]
        public async Task Result_object_is_serialized()
        {
            using var host = await TestApp.StartAsync();
            var client = host.GetTestClient();

            var response = await client.SendAsync(TestApp.Post("/forms/object", new Dictionary<string, string>
            {
                ["Title"] = "Book",
                ["InStock"] = "5"
            }));

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var obj = document.RootElement.GetProperty("object");

            Assert.Equal(42, obj.GetProperty("productId").GetInt32());
            Assert.Equal("Book", obj.GetProperty("title").GetString());
        }

        [Fact]
        public async Task Request_not_sent_by_formhelper_is_rejected()
        {
            using var host = await TestApp.StartAsync();
            var client = host.GetTestClient();

            var response = await client.SendAsync(TestApp.Post("/forms/product", new Dictionary<string, string>
            {
                ["Title"] = "Book",
                ["InStock"] = "5"
            }, formHelperRequest: false));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("formhelper.js", await response.Content.ReadAsStringAsync());
        }

        [Fact]
        public async Task Get_requests_are_not_affected_by_a_controller_level_attribute()
        {
            using var host = await TestApp.StartAsync();
            var client = host.GetTestClient();

            var response = await client.GetAsync("/forms");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("form page", await response.Content.ReadAsStringAsync());
        }

        [Fact]
        public async Task Missing_antiforgery_token_returns_a_form_result()
        {
            using var host = await TestApp.StartAsync();
            var client = host.GetTestClient();

            var response = await client.SendAsync(TestApp.Post("/antiforgery", new Dictionary<string, string>
            {
                ["Title"] = "Book",
                ["InStock"] = "5"
            }));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

            Assert.Equal(4, document.RootElement.GetProperty("status").GetInt32());
            Assert.Equal(new FormHelperOptions().InvalidRequestMessage, document.RootElement.GetProperty("message").GetString());
        }

        [Fact]
        public async Task Model_validators_run_asynchronously_and_use_the_binding_prefix()
        {
            using var host = await TestApp.StartAsync(services =>
                services.AddSingleton<IFormModelValidator, TitleNotTakenValidator>());
            var client = host.GetTestClient();

            var withoutPrefix = await client.SendAsync(TestApp.Post("/forms/product", new Dictionary<string, string>
            {
                ["Title"] = "taken",
                ["InStock"] = "5"
            }));

            var withPrefix = await client.SendAsync(TestApp.Post("/forms/prefixed", new Dictionary<string, string>
            {
                ["product.Title"] = "taken",
                ["product.InStock"] = "5"
            }));

            Assert.Equal("Title", await FirstErrorKey(withoutPrefix));
            Assert.Equal("product.Title", await FirstErrorKey(withPrefix));
        }

        private static async Task<string?> FirstErrorKey(HttpResponseMessage response)
        {
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

            return document.RootElement.GetProperty("validationErrors")[0].GetProperty("propertyName").GetString();
        }

        private class TitleNotTakenValidator : IFormModelValidator
        {
            public async Task ValidateAsync(FormModelValidationContext context)
            {
                await Task.Yield();

                if (context.Model is ProductModel product && product.Title == "taken")
                {
                    context.ModelState.AddModelError(context.GetKey(nameof(ProductModel.Title)), "This title is already taken.");
                }
            }
        }
    }
}
