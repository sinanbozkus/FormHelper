using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace FormHelper.FluentValidation.Tests
{
    public class ServerValidationTests
    {
        private static readonly Dictionary<string, string> ValidForm = new Dictionary<string, string>
        {
            ["UserName"] = "sinan",
            ["Email"] = "sinan@example.com",
            ["Password"] = "secret1",
            ["ConfirmPassword"] = "secret1",
            ["Age"] = "30",
            ["Quantity"] = "2",
            ["Count"] = "1",
            ["Code"] = "ABC",
            ["Country"] = "Turkey"
        };

        [Fact]
        public async Task Valid_model_runs_the_action()
        {
            using var host = await StartAsync();

            var json = await PostAsync(host, "/register", ValidForm);

            Assert.Equal(1, json.GetProperty("status").GetInt32());
        }

        [Fact]
        public async Task Async_rules_run_and_errors_are_returned()
        {
            using var host = await StartAsync();

            var json = await PostAsync(host, "/register", With(ValidForm, "UserName", "taken", "Email", "not-an-email"));
            var errors = Errors(json);

            Assert.Equal(new[] { "This user name is taken." }, errors["UserName"]);
            Assert.Equal(new[] { "'Email' is not a valid email address." }, errors["Email"]);
        }

        [Fact]
        public async Task Errors_use_the_binding_prefix()
        {
            using var host = await StartAsync();

            var form = ValidForm.ToDictionary(p => "registration." + p.Key, p => p.Value);
            form["registration.UserName"] = "taken";

            var errors = Errors(await PostAsync(host, "/register-prefixed", form));

            Assert.Equal(new[] { "This user name is taken." }, errors["registration.UserName"]);
        }

        [Fact]
        public async Task Actions_without_FormValidator_are_not_validated()
        {
            using var host = await StartAsync();

            var response = await host.GetTestClient().SendAsync(Post("/plain", With(ValidForm, "UserName", "taken")));

            Assert.Equal("valid", await response.Content.ReadAsStringAsync());
        }

#if NET8_0_OR_GREATER
        // FluentValidation.AspNetCore doesn't support FluentValidation 12; a stand-in with its name is used here.
        // FluentValidationAspNetCoreTests tests the real package on the older runtimes.
        [Fact]
        public async Task Models_are_not_validated_twice_when_FluentValidation_AspNetCore_auto_validation_is_on()
        {
            using var host = await StartAsync(services => services.Configure<MvcOptions>(o =>
                o.ModelValidatorProviders.Add(new global::FluentValidation.AspNetCore.FluentValidationModelValidatorProvider())));

            var json = await PostAsync(host, "/register", With(ValidForm, "UserName", "taken"));

            // Our validator stepped aside; the (fake) auto validation provider validates nothing.
            Assert.Equal(1, json.GetProperty("status").GetInt32());
        }
#endif

        internal static async Task<IHost> StartAsync(Action<IServiceCollection>? configure = null)
        {
            var host = new HostBuilder()
                .ConfigureWebHost(web => web
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddControllers()
                            .AddApplicationPart(typeof(ServerValidationTests).Assembly)
                            .AddFormHelper()
                            .AddFormHelperFluentValidation();

                        services.AddValidatorsFromAssemblyContaining<RegistrationValidator>();
                        configure?.Invoke(services);
                    })
                    .Configure(app =>
                    {
                        app.UseRouting();
                        app.UseEndpoints(endpoints => endpoints.MapControllers());
                    }))
                .Build();

            await host.StartAsync();
            return host;
        }

        private static HttpRequestMessage Post(string url, Dictionary<string, string> form)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = new FormUrlEncodedContent(form) };
            request.Headers.Add("X-Requested-With", "XMLHttpRequest");
            return request;
        }

        internal static async Task<JsonElement> PostAsync(IHost host, string url, Dictionary<string, string> form)
        {
            var response = await host.GetTestClient().SendAsync(Post(url, form));
            return JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement.Clone();
        }

        internal static Dictionary<string, string[]> Errors(JsonElement json)
        {
            return json.GetProperty("validationErrors").EnumerateArray().ToDictionary(
                e => e.GetProperty("propertyName").GetString()!,
                e => e.GetProperty("messages").EnumerateArray().Select(m => m.GetString()!).ToArray());
        }

        private static Dictionary<string, string> With(Dictionary<string, string> form, params string[] pairs)
        {
            var copy = new Dictionary<string, string>(form);
            for (var i = 0; i < pairs.Length; i += 2)
            {
                copy[pairs[i]] = pairs[i + 1];
            }
            return copy;
        }
    }

    public class RegistrationController : Controller
    {
        [HttpPost("/register"), FormValidator(ValidateAntiforgeryToken = false)]
        public IActionResult Register(Registration registration) => FormResult.CreateSuccessResult("Registered.");

        [HttpPost("/register-prefixed"), FormValidator(ValidateAntiforgeryToken = false)]
        public IActionResult RegisterPrefixed([Bind(Prefix = "registration")] Registration model) => FormResult.CreateSuccessResult("Registered.");

        [HttpPost("/plain")]
        public IActionResult Plain(Registration registration) => Content(ModelState.IsValid ? "valid" : "invalid");
    }
}

#if NET8_0_OR_GREATER
namespace FluentValidation.AspNetCore
{
    // Stands in for FluentValidation.AspNetCore's auto validation provider (detected by its full type name).
    public class FluentValidationModelValidatorProvider : IModelValidatorProvider
    {
        public void CreateValidators(ModelValidatorProviderContext context)
        {
        }
    }
}
#endif
