using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace FormHelper.Tests
{
    public class TempDataAndAntiforgeryTests
    {
        // A redirect converted to a FormResult keeps the TempData values read in the request, like a redirect does.
        [Fact]
        public async Task Redirects_keep_the_temp_data_read_in_the_request()
        {
            using var host = await TestApp.StartAsync(services => services.AddControllersWithViews());
            var client = host.GetTestClient();
            var cookies = new Dictionary<string, string>();

            await SendAsync(client, cookies, new HttpRequestMessage(HttpMethod.Get, "/tempdata/set"));
            var save = await SendAsync(client, cookies, TestApp.Post("/tempdata/save", new Dictionary<string, string>()));
            var confirm = await SendAsync(client, cookies, new HttpRequestMessage(HttpMethod.Get, "/tempdata/confirm"));

            using var document = JsonDocument.Parse(await save.Content.ReadAsStringAsync());
            Assert.Equal("/tempdata/confirm", document.RootElement.GetProperty("redirectUri").GetString());
            Assert.Equal("42", await confirm.Content.ReadAsStringAsync());
        }

        // Razor Pages and [AutoValidateAntiforgeryToken] reject an invalid token before [FormValidator] runs.
        [Fact]
        public async Task A_token_rejected_before_FormValidator_returns_the_invalid_request_message()
        {
            using var host = await TestApp.StartAsync(services =>
                services.AddControllersWithViews(o => o.Filters.Add(new AutoValidateAntiforgeryTokenAttribute())));

            var response = await host.GetTestClient().SendAsync(TestApp.Post("/forms/product", new Dictionary<string, string> { ["Title"] = "Book" }));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal(4, document.RootElement.GetProperty("status").GetInt32());
            Assert.Equal(new FormHelperOptions().InvalidRequestMessage, document.RootElement.GetProperty("message").GetString());
        }

        [Fact]
        public async Task A_rejected_token_of_a_normal_post_is_left_as_it_is()
        {
            using var host = await TestApp.StartAsync(services =>
                services.AddControllersWithViews(o => o.Filters.Add(new AutoValidateAntiforgeryTokenAttribute())));

            var response = await host.GetTestClient().SendAsync(TestApp.Post("/forms/product", new Dictionary<string, string>(), formHelperRequest: false));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal("", await response.Content.ReadAsStringAsync());
        }

        // TestServer has no cookie container.
        private static async Task<HttpResponseMessage> SendAsync(HttpClient client, Dictionary<string, string> cookies, HttpRequestMessage request)
        {
            if (cookies.Count > 0)
            {
                request.Headers.Add("Cookie", string.Join("; ", cookies.Select(c => c.Key + "=" + c.Value)));
            }

            var response = await client.SendAsync(request);

            if (response.Headers.TryGetValues("Set-Cookie", out var values))
            {
                foreach (var pair in values.Select(v => v.Split(';')[0].Split(new[] { '=' }, 2)))
                {
                    if (pair[1].Length == 0)
                    {
                        cookies.Remove(pair[0]);
                    }
                    else
                    {
                        cookies[pair[0]] = pair[1];
                    }
                }
            }

            return response;
        }
    }

    public class TempDataController : Controller
    {
        [HttpGet("/tempdata/set")]
        public IActionResult Set()
        {
            TempData["DraftId"] = "42";
            return Ok();
        }

        [HttpPost("/tempdata/save"), FormValidator(ValidateAntiforgeryToken = false)]
        public IActionResult Save()
        {
            var draftId = TempData["DraftId"]; // read: removed at the end of the request unless kept
            return RedirectToAction(nameof(Confirm));
        }

        [HttpGet("/tempdata/confirm")]
        public IActionResult Confirm() => Content(TempData["DraftId"]?.ToString() ?? "none");
    }
}
