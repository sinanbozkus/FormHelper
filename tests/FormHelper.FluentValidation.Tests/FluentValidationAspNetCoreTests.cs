#if !NET8_0_OR_GREATER
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace FormHelper.FluentValidation.Tests
{
    /// <summary>
    /// A project that still uses FluentValidation.AspNetCore (which supports FluentValidation 11 only) next to FormHelper.FluentValidation.
    /// </summary>
    public class FluentValidationAspNetCoreTests
    {
        [Fact]
        public async Task Models_are_not_validated_twice_when_auto_validation_is_on()
        {
            using var host = await ServerValidationTests.StartAsync(services => services.AddFluentValidationAutoValidation());
            ContactValidator.Runs = 0;

            var json = await ServerValidationTests.PostAsync(host, "/contact", new Dictionary<string, string> { ["Name"] = "" });

            Assert.Equal(new[] { "'Name' must not be empty." }, ServerValidationTests.Errors(json)["Name"]);
            Assert.Equal(1, ContactValidator.Runs);
        }

        [Fact]
        public async Task Models_are_validated_once_without_auto_validation()
        {
            using var host = await ServerValidationTests.StartAsync();
            ContactValidator.Runs = 0;

            var json = await ServerValidationTests.PostAsync(host, "/contact", new Dictionary<string, string> { ["Name"] = "" });

            Assert.Equal(new[] { "'Name' must not be empty." }, ServerValidationTests.Errors(json)["Name"]);
            Assert.Equal(1, ContactValidator.Runs);
        }

        [Fact]
        public async Task Its_client_side_adapters_are_used_instead_of_ours()
        {
            using var host = await ServerValidationTests.StartAsync(services => services.AddFluentValidationClientsideAdapters());

            var providers = host.Services.GetRequiredService<IOptions<MvcViewOptions>>().Value.ClientModelValidatorProviders;

            Assert.Contains(providers, p => p.GetType().FullName == "FluentValidation.AspNetCore.FluentValidationClientModelValidatorProvider");
            Assert.DoesNotContain(providers, p => p is ClientSide.FluentValidationClientModelValidatorProvider);
        }
    }

    public class Contact
    {
        public string? Name { get; set; }
    }

    // Synchronous: FluentValidation.AspNetCore's auto validation can't run async rules.
    public class ContactValidator : AbstractValidator<Contact>
    {
        // How many times a Contact was validated (the tests of a class run one at a time).
        public static int Runs;

        public ContactValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
            RuleFor(x => x).Must(_ => Interlocked.Increment(ref Runs) > 0);
        }
    }

    public class ContactController : Controller
    {
        [HttpPost("/contact"), FormValidator(ValidateAntiforgeryToken = false)]
        public IActionResult Save(Contact contact) => FormResult.CreateSuccessResult("Sent.");
    }
}
#endif
