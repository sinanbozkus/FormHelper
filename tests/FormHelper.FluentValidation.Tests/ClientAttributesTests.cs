using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using Xunit;

namespace FormHelper.FluentValidation.Tests
{
    /// <summary>
    /// The data-val-* attributes MVC's tag helpers render for a property, through the registered client validator providers.
    /// </summary>
    public class ClientAttributesTests
    {
        private readonly IServiceProvider _services;

        public ClientAttributesTests()
        {
            var services = new ServiceCollection();
            AddHostServices(services);
            services.AddControllersWithViews().AddFormHelper().AddFormHelperFluentValidation();
            services.AddValidatorsFromAssemblyContaining<RegistrationValidator>();
            _services = services.BuildServiceProvider();
        }

        [Fact]
        public void NotEmpty_and_EmailAddress()
        {
            var attributes = AttributesFor(nameof(Registration.Email));

            Assert.Equal("true", attributes["data-val"]);
            Assert.Equal("'Email' must not be empty.", attributes["data-val-required"]);
            Assert.Equal("'Email' is not a valid email address.", attributes["data-val-email"]);
        }

        [Fact]
        public void Minimum_and_maximum_length_use_messages_without_the_entered_length()
        {
            var attributes = AttributesFor(nameof(Registration.UserName));

            Assert.Equal("3", attributes["data-val-minlength-min"]);
            Assert.Equal("The length of 'User Name' must be at least 3 characters.", attributes["data-val-minlength"]);
            Assert.Equal("20", attributes["data-val-maxlength-max"]);
            Assert.Equal("The length of 'User Name' must be 20 characters or fewer.", attributes["data-val-maxlength"]);
        }

        [Fact]
        public void Length()
        {
            var attributes = AttributesFor(nameof(Registration.Password));

            Assert.Equal("6", attributes["data-val-length-min"]);
            Assert.Equal("50", attributes["data-val-length-max"]);
            Assert.Equal("'Password' must be between 6 and 50 characters.", attributes["data-val-length"]);
        }

        [Fact]
        public void Equal_to_another_property()
        {
            var attributes = AttributesFor(nameof(Registration.ConfirmPassword));

            Assert.Equal("*.Password", attributes["data-val-equalto-other"]);
            Assert.Equal("'Confirm Password' must be equal to 'Password'.", attributes["data-val-equalto"]);
        }

        [Fact]
        public void InclusiveBetween()
        {
            var attributes = AttributesFor(nameof(Registration.Age));

            Assert.Equal("18", attributes["data-val-range-min"]);
            Assert.Equal("99", attributes["data-val-range-max"]);
            Assert.Equal("'Age' must be between 18 and 99.", attributes["data-val-range"]);
        }

        [Fact]
        public void GreaterThanOrEqualTo_and_LessThanOrEqualTo_make_one_range()
        {
            var attributes = AttributesFor(nameof(Registration.Quantity));

            Assert.Equal("1", attributes["data-val-range-min"]);
            Assert.Equal("10", attributes["data-val-range-max"]);
        }

        [Fact]
        public void Matches()
        {
            Assert.Equal(@"[\s\S]*?(?:^[A-Z]{3}$)[\s\S]*", AttributesFor(nameof(Registration.Code))["data-val-regex-pattern"]);
        }

        // Matches passes when the pattern is found anywhere; the client matches the whole value.
        [Fact]
        public void Matches_finds_the_pattern_anywhere_like_the_server()
        {
            var pattern = new Regex(AttributesFor(nameof(Registration.Tag))["data-val-regex-pattern"]);

            Assert.True(IsWholeMatch(pattern, "ABC123"));
            Assert.True(IsWholeMatch(pattern, "x-Y-z"));
            Assert.False(IsWholeMatch(pattern, "abc123"));
        }

        [Theory]
        [InlineData(nameof(Registration.Slug))]    // RegexOptions.IgnoreCase can't be sent to the client
        [InlineData(nameof(Registration.Word))]    // (?i) is .NET-only syntax
        [InlineData(nameof(Registration.Pattern))] // the pattern comes from the model
        [InlineData(nameof(Registration.Atomic))]  // atomic groups are .NET-only
        [InlineData(nameof(Registration.Letters))]   // \w matches "ç" in .NET, not in JavaScript
        [InlineData(nameof(Registration.Digits))]  // \d matches all Unicode digits in .NET
        [InlineData(nameof(Registration.EcmaWord))] // RegexOptions.ECMAScript's \w still matches "İ"
        public void Patterns_the_client_cant_run_are_validated_on_the_server_only(string property)
        {
            Assert.False(AttributesFor(property).ContainsKey("data-val-regex"));
        }

        [Theory]
        [InlineData(nameof(Registration.Backslash))] // \\w is a backslash and a "w"
        [InlineData(nameof(Registration.Named))]     // named groups work in JavaScript too
        public void Patterns_that_mean_the_same_in_JavaScript_are_sent_to_the_client(string property)
        {
            Assert.True(AttributesFor(property).ContainsKey("data-val-regex"));
        }

        // Like the client's regex rule: the match must cover the whole value.
        private static bool IsWholeMatch(Regex pattern, string value)
        {
            var match = pattern.Match(value);
            return match.Success && match.Index == 0 && match.Length == value.Length;
        }

        [Fact]
        public void Fluent_validation_message_wins_over_the_implicit_required_of_a_value_type()
        {
            Assert.Equal("Count please", AttributesFor(nameof(Registration.Count))["data-val-required"]);
        }

        [Fact]
        public void Custom_message_placeholders_are_filled()
        {
            Assert.Equal("Please enter Country.", AttributesFor(nameof(Registration.Country))["data-val-required"]);
        }

        [Fact]
        public void Conditional_rules_are_not_sent_to_the_client()
        {
            Assert.False(AttributesFor(nameof(Registration.Nickname)).ContainsKey("data-val-required"));
        }

        [Fact]
        public void Async_rules_are_not_sent_to_the_client_but_the_others_are()
        {
            var attributes = AttributesFor(nameof(Registration.UserName));

            Assert.Equal("'User Name' must not be empty.", attributes["data-val-required"]);
            Assert.DoesNotContain(attributes.Values, v => v.Contains("taken"));
        }

        [Fact]
        public void Messages_are_localized_by_fluent_validation()
        {
            var culture = CultureInfo.CurrentUICulture;

            try
            {
                CultureInfo.CurrentUICulture = new CultureInfo("tr-TR");

                var message = AttributesFor(nameof(Registration.Email))["data-val-required"];

                Assert.NotEqual("'Email' must not be empty.", message);
                Assert.Contains("Email", message);
            }
            finally
            {
                CultureInfo.CurrentUICulture = culture;
            }
        }

        [Fact]
        public void The_adapters_can_be_turned_off()
        {
            var services = new ServiceCollection();
            AddHostServices(services);
            services.AddControllersWithViews().AddFormHelperFluentValidation(o => o.ClientSideValidation = false);
            services.AddValidatorsFromAssemblyContaining<RegistrationValidator>();

            var attributes = AttributesFor(nameof(Registration.Email), services.BuildServiceProvider());

            Assert.False(attributes.ContainsKey("data-val-email"));
        }

        // Registered by the web host in an application.
        private static void AddHostServices(IServiceCollection services)
        {
            services.AddLogging();
            var listener = new DiagnosticListener("Microsoft.AspNetCore");
            services.AddSingleton(listener);
            services.AddSingleton<DiagnosticSource>(listener);
        }

        private Dictionary<string, string> AttributesFor(string property, IServiceProvider? services = null)
        {
            services ??= _services;

            var metadataProvider = services.GetRequiredService<IModelMetadataProvider>();
            var metadata = metadataProvider.GetMetadataForProperty(typeof(Registration), property);
            var providers = services.GetRequiredService<IOptions<MvcViewOptions>>().Value.ClientModelValidatorProviders;

            var context = new ClientValidatorProviderContext(metadata, metadata.ValidatorMetadata.Select(m => new ClientValidatorItem(m)).ToList());
            foreach (var provider in providers)
            {
                provider.CreateValidators(context);
            }

            var httpContext = new DefaultHttpContext { RequestServices = services.CreateScope().ServiceProvider };
            var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
            var attributes = new Dictionary<string, string>();

            foreach (var item in context.Results.Where(r => r.Validator != null))
            {
                item.Validator!.AddValidation(new ClientModelValidationContext(actionContext, metadata, metadataProvider, attributes));
            }

            return attributes;
        }
    }
}
