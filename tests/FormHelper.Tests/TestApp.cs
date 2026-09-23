using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Net.Http;
using System.Threading.Tasks;

namespace FormHelper.Tests
{
    /// <summary>
    /// A minimal MVC app hosted in memory. The app's own JSON options are PascalCase on purpose:
    /// FormResult must not depend on them.
    /// </summary>
    internal static class TestApp
    {
        public static async Task<IHost> StartAsync(Action<IServiceCollection>? configureServices = null)
        {
            var host = new HostBuilder()
                .ConfigureWebHost(web => web
                    .UseTestServer()
                    .ConfigureServices(services =>
                    {
                        services.AddControllers()
                            .AddApplicationPart(typeof(TestApp).Assembly)
                            .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null)
                            .AddFormHelper();

                        configureServices?.Invoke(services);
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

        public static HttpRequestMessage Post(string url, IDictionary<string, string> form, bool formHelperRequest = true)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new FormUrlEncodedContent(form)
            };

            if (formHelperRequest)
            {
                request.Headers.Add("X-Requested-With", "XMLHttpRequest");
            }

            return request;
        }
    }

    public class ProductModel
    {
        [Required(ErrorMessage = "Title is required.")]
        [StringLength(10, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 10 characters.")]
        public string? Title { get; set; }

        [Range(1, 100, ErrorMessage = "In Stock must be between 1 and 100.")]
        public int InStock { get; set; }
    }

    [FormValidator(ValidateAntiforgeryToken = false)]
    public class FormsController : Controller
    {
        [HttpGet("/forms")]
        public IActionResult Index() => Content("form page");

        [HttpPost("/forms/product")]
        public IActionResult Save(ProductModel model) => FormResult.CreateSuccessResult("Saved.", "/products");

        [HttpPost("/forms/object")]
        public IActionResult SaveWithObject(ProductModel model)
            => FormResult.CreateSuccessResultWithObject(new { ProductId = 42, model.Title });

        [HttpPost("/forms/prefixed")]
        public IActionResult SavePrefixed([Bind(Prefix = "product")] ProductModel model) => FormResult.CreateSuccessResult("Saved.");
    }

    public class AntiforgeryController : Controller
    {
        [HttpPost("/antiforgery"), FormValidator]
        public IActionResult Save(ProductModel model) => FormResult.CreateSuccessResult("Saved.");
    }
}
