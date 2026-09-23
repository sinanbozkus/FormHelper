using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.TestHost;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace FormHelper.Tests
{
    /// <summary>
    /// fetch follows redirects by itself, so a redirect from a FormHelper post is returned as a FormResult.
    /// </summary>
    public class FormValidatorRedirectTests
    {
        [Theory]
        [InlineData("/redirects/to-action", "/redirects?sort=name")]
        [InlineData("/redirects/to-route", "/redirects")]
        [InlineData("/redirects/app-relative", "/done")]
        [InlineData("/redirects/local", "/done?x=1")]
        [InlineData("/redirects/external", "https://example.com/")]
        public async Task Redirect_results_become_a_form_result(string url, string redirectUri)
        {
            using var host = await TestApp.StartAsync();

            var response = await host.GetTestClient().SendAsync(TestApp.Post(url, new Dictionary<string, string>()));

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal(redirectUri, document.RootElement.GetProperty("redirectUri").GetString());
            Assert.True(document.RootElement.GetProperty("isSucceed").GetBoolean());
            Assert.False(document.RootElement.TryGetProperty("message", out _));
        }

        [Fact]
        public async Task Redirects_that_keep_the_method_are_not_converted()
        {
            using var host = await TestApp.StartAsync();

            var response = await host.GetTestClient().SendAsync(TestApp.Post("/redirects/preserve", new Dictionary<string, string>()));

            // fetch repeats the POST at the new url
            Assert.Equal(HttpStatusCode.TemporaryRedirect, response.StatusCode);
            Assert.Equal("/redirects/target", response.Headers.Location?.OriginalString);
        }

        [Fact]
        public async Task Get_requests_redirect_as_usual()
        {
            using var host = await TestApp.StartAsync();

            var response = await host.GetTestClient().GetAsync("/redirects/get");

            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        }

        [Fact]
        public async Task Normal_posts_redirect_as_usual()
        {
            using var host = await TestApp.StartAsync();

            var response = await host.GetTestClient().SendAsync(TestApp.Post("/native-redirect", new Dictionary<string, string>(), formHelperRequest: false));

            Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
            Assert.Equal("/redirects", response.Headers.Location?.OriginalString);
        }
    }

    [FormValidator(ValidateAntiforgeryToken = false)]
    public class RedirectsController : Controller
    {
        [HttpGet("/redirects", Name = "redirects")]
        public IActionResult Index() => Content("list");

        [HttpPost("/redirects/to-action")]
        public IActionResult ToAction() => RedirectToAction(nameof(Index), new { sort = "name" });

        [HttpPost("/redirects/to-route")]
        public IActionResult ToRoute() => RedirectToRoute("redirects");

        [HttpPost("/redirects/app-relative")]
        public IActionResult AppRelative() => Redirect("~/done");

        [HttpPost("/redirects/local")]
        public IActionResult Local() => LocalRedirect("/done?x=1");

        [HttpPost("/redirects/external")]
        public IActionResult External() => Redirect("https://example.com/");

        [HttpPost("/redirects/preserve")]
        public IActionResult Preserve() => RedirectToActionPreserveMethod(nameof(Target));

        [HttpPost("/redirects/target")]
        public IActionResult Target() => FormResult.CreateSuccessResult("Moved.");

        [HttpGet("/redirects/get")]
        public IActionResult Get() => RedirectToAction(nameof(Index));
    }

    public class NativeRedirectController : Controller
    {
        [HttpPost("/native-redirect"), FormValidator(UseAjax = false, ValidateAntiforgeryToken = false)]
        public IActionResult Save() => RedirectToAction(nameof(RedirectsController.Index), "Redirects");
    }
}
