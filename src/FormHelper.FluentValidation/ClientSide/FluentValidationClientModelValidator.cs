using FluentValidation;
using FluentValidation.Internal;
using FluentValidation.Validators;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;

namespace FormHelper.FluentValidation.ClientSide
{
    /// <summary>
    /// Writes the data-val-* attributes (read by FormHelper's built-in validator and jQuery Validation Unobtrusive)
    /// for the rules of a property that can run in the browser:
    /// NotNull, NotEmpty, Length, MinimumLength, MaximumLength, Matches (patterns JavaScript can run), EmailAddress, CreditCard, InclusiveBetween,
    /// GreaterThanOrEqualTo / LessThanOrEqualTo a constant, and Equal to another property.
    /// Rules with When/Unless conditions, rule sets or custom logic are validated on the server only.
    /// </summary>
    internal sealed class FluentValidationClientModelValidator : IClientModelValidator
    {
        private readonly Type _containerType;
        private readonly string _propertyName;

        public FluentValidationClientModelValidator(Type containerType, string propertyName)
        {
            _containerType = containerType;
            _propertyName = propertyName;
        }

        public void AddValidation(ClientModelValidationContext context)
        {
            var services = context.ActionContext.HttpContext.RequestServices;

            if (!(services?.GetService(typeof(IValidator<>).MakeGenericType(_containerType)) is IValidator validator))
            {
                return;
            }

            var rules = new ClientRules();

            foreach (var rule in validator.CreateDescriptor().GetRulesForMember(_propertyName))
            {
                if (!CanRunOnClient(rule))
                {
                    continue;
                }

                foreach (var component in rule.Components)
                {
                    if (!component.HasCondition && !component.HasAsyncCondition)
                    {
                        AddRule(rules, rule, component);
                    }
                }
            }

            rules.WriteTo(context.Attributes);
        }

        private static bool CanRunOnClient(IValidationRule rule)
        {
            if (rule.HasCondition || rule.HasAsyncCondition)
            {
                return false;
            }

            // Rules in a named rule set don't run by default.
            if (rule.RuleSets != null && rule.RuleSets.Length > 0 &&
                !rule.RuleSets.Any(r => string.Equals(r, "default", StringComparison.OrdinalIgnoreCase)))
            {
                return false;
            }

            // RuleForEach validates the items of a collection, not the property's input.
            return !rule.GetType().GetInterfaces().Any(i => i.Name.StartsWith("ICollectionRule", StringComparison.Ordinal));
        }

        private static void AddRule(ClientRules rules, IValidationRule rule, IRuleComponent component)
        {
            var displayName = rule.GetDisplayName(null!);

            switch (component.Validator)
            {
                case INotNullValidator _:
                case INotEmptyValidator _:
                    rules.Add("required", Message(component, displayName));
                    break;

                case ILengthValidator length:
                    AddLength(rules, component, length, displayName);
                    break;

                case IRegularExpressionValidator regex when ClientPattern(regex) is string pattern:
                    rules.Add("regex", Message(component, displayName), ("pattern", pattern));
                    break;

                case IEmailValidator _:
                    rules.Add("email", Message(component, displayName));
                    break;

                case ICreditCardValidator _:
                    rules.Add("creditcard", Message(component, displayName));
                    break;

                case IBetweenValidator between when component.Validator.Name == "InclusiveBetweenValidator"
                                                   && IsNumber(between.From) && IsNumber(between.To):
                    rules.AddRange(Message(component, displayName, "InclusiveBetween_Simple",
                            ("From", between.From), ("To", between.To)),
                        ToInvariant(between.From), ToInvariant(between.To));
                    break;

                case IComparisonValidator comparison:
                    AddComparison(rules, component, comparison, displayName);
                    break;
            }
        }

        private static void AddLength(ClientRules rules, IRuleComponent component, ILengthValidator length, string displayName)
        {
            // Lengths from a lambda (Length(x => x.Min, ...)) are only known on the server.
            var type = length.GetType();
            if (type.GetProperty("MinFunc")?.GetValue(length) != null || type.GetProperty("MaxFunc")?.GetValue(length) != null)
            {
                return;
            }

            var min = length.Min.ToString(CultureInfo.InvariantCulture);
            var max = length.Max.ToString(CultureInfo.InvariantCulture);
            var args = new (string, object?)[] { ("MinLength", length.Min), ("MaxLength", length.Max) };

            switch (component.Validator.Name)
            {
                case "MinimumLengthValidator":
                    rules.Add("minlength", Message(component, displayName, "MinimumLength_Simple", args), ("min", min));
                    break;
                case "MaximumLengthValidator":
                    rules.Add("maxlength", Message(component, displayName, "MaximumLength_Simple", args), ("max", max));
                    break;
                case "ExactLengthValidator":
                    rules.Add("length", Message(component, displayName, "ExactLength_Simple", args), ("min", min), ("max", max));
                    break;
                default:
                    rules.Add("length", Message(component, displayName, "Length_Simple", args), ("min", min), ("max", max));
                    break;
            }
        }

        private static void AddComparison(ClientRules rules, IRuleComponent component, IComparisonValidator comparison, string displayName)
        {
            if (comparison.Comparison == Comparison.Equal && comparison.MemberToCompare != null)
            {
                var other = comparison.MemberToCompare;
                rules.Add("equalto", Message(component, displayName, null, ("ComparisonValue", DisplayName(other))),
                    ("other", "*." + other.Name));
                return;
            }

            if (comparison.MemberToCompare != null || !IsNumber(comparison.ValueToCompare))
            {
                return;
            }

            var message = Message(component, displayName, null, ("ComparisonValue", comparison.ValueToCompare));
            var value = ToInvariant(comparison.ValueToCompare);

            if (comparison.Comparison == Comparison.GreaterThanOrEqual)
            {
                rules.AddRange(message, value, null);
            }
            else if (comparison.Comparison == Comparison.LessThanOrEqual)
            {
                rules.AddRange(message, null, value);
            }
        }

        /// <summary>
        /// The rule's message with the placeholders filled. When the rule uses FluentValidation's default message,
        /// the "_Simple" variant is used if there is one (the default length messages mention the entered length,
        /// which is unknown in the browser). Messages are localized by FluentValidation's LanguageManager.
        /// </summary>
        private static string Message(IRuleComponent component, string displayName,
            string? simpleKey = null, params (string Name, object? Value)[] arguments)
        {
            var defaultTemplate = component.Validator.GetDefaultMessageTemplate(component.ErrorCode);
            string template;

            try
            {
                template = component.GetUnformattedErrorMessage();
            }
            catch (Exception)
            {
                // WithMessage(x => ...) needs the model instance, which doesn't exist while rendering the form.
                template = defaultTemplate;
            }

            if (simpleKey != null && template == defaultTemplate)
            {
                template = ValidatorOptions.Global.LanguageManager.GetString(simpleKey) ?? template;
            }

            var formatter = ValidatorOptions.Global.MessageFormatterFactory().AppendPropertyName(displayName);

            foreach (var (name, value) in arguments)
            {
                formatter.AppendArgument(name, value);
            }

            return formatter.BuildMessage(template);
        }

        // Same as FluentValidation: the DisplayNameResolver, otherwise "ConfirmPassword" -> "Confirm Password".
        private static string DisplayName(MemberInfo member)
        {
            return ValidatorOptions.Global.DisplayNameResolver(member.DeclaringType, member, null)
                   ?? Regex.Replace(member.Name, "(?<=[a-z0-9])(?=[A-Z])", " ", RegexOptions.None, RegexTimeout);
        }

        private static bool IsNumber(object? value)
        {
            return value is byte || value is sbyte || value is short || value is ushort || value is int || value is uint ||
                   value is long || value is ulong || value is float || value is double || value is decimal;
        }

        private static readonly TimeSpan RegexTimeout = TimeSpan.FromSeconds(1);

        // Common syntax JavaScript doesn't have (or reads differently): inline options, comments, atomic groups,
        // conditionals, balancing groups, named groups with quotes, \A \Z \z \G anchors, unicode categories and
        // character class subtraction. It can't list everything; the client skips a pattern it can't parse.
        private static readonly Regex DotNetOnlySyntax = new Regex(@"\(\?[imnsx-]+[:)]|\(\?#|\(\?>|\(\?\(|\(\?<[^>=!]*-|\(\?'|\\[AZzG]|\\[pP]\{|-\[", RegexOptions.None, RegexTimeout);

        // \w \d \b and their negations are Unicode-aware in .NET (e.g. \w matches "ç") but ASCII-only in JavaScript,
        // so the browser would reject values the server accepts. RegexOptions.ECMAScript doesn't make them equal either
        // (its \w still matches "İ"). An escaped backslash (\\w) is a literal and doesn't count.
        private static readonly Regex UnicodeAwareClasses = new Regex(@"(?<!\\)(?:\\\\)*\\[wWdDbB]", RegexOptions.None, RegexTimeout);

        private const RegexOptions ClientCompatibleOptions = RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.ECMAScript;

        /// <summary>
        /// Matches passes when the pattern is found anywhere in the value (Regex.IsMatch), while the client requires the
        /// whole value to match, so the pattern is wrapped. Patterns the browser can't run the same way are validated on
        /// the server only: with options (e.g. RegexOptions.IgnoreCase), .NET-only syntax, \w \d \b, and patterns that
        /// depend on the model.
        /// </summary>
        private static string? ClientPattern(IRegularExpressionValidator validator)
        {
            var regex = GetRegex(validator);

            if (regex == null || (regex.Options & ~ClientCompatibleOptions) != 0)
            {
                return null;
            }

            var pattern = regex.ToString();

            if (DotNetOnlySyntax.IsMatch(pattern) || UnicodeAwareClasses.IsMatch(pattern))
            {
                return null;
            }

            return @"[\s\S]*?(?:" + pattern + @")[\s\S]*";
        }

        // FluentValidation keeps the Regex (and its options) behind a private Func<T, Regex> (versions 11 and 12).
        // A Func that needs the model (Matches(x => x.Pattern)) throws with null and isn't sent to the client.
        private static Regex? GetRegex(IRegularExpressionValidator validator)
        {
            if (validator.Expression == null ||
                !(validator.GetType().GetField("_regexFunc", BindingFlags.Instance | BindingFlags.NonPublic)?.GetValue(validator) is Delegate func))
            {
                return null;
            }

            try
            {
                return func.DynamicInvoke(new object?[] { null }) as Regex;
            }
            catch (TargetInvocationException)
            {
                return null;
            }
        }

        private static string ToInvariant(object? value)
        {
            return Convert.ToString(value, CultureInfo.InvariantCulture) ?? "";
        }

        /// <summary>
        /// Collects the attributes first: GreaterThanOrEqualTo and LessThanOrEqualTo together make one "range".
        /// </summary>
        private sealed class ClientRules
        {
            private readonly Dictionary<string, string> _attributes = new Dictionary<string, string>();
            private string? _rangeMessage;
            private string? _rangeMin;
            private string? _rangeMax;

            public void Add(string rule, string message, params (string Name, string Value)[] parameters)
            {
                var key = "data-val-" + rule;

                if (_attributes.ContainsKey(key))
                {
                    return;
                }

                _attributes[key] = message;

                foreach (var (name, value) in parameters)
                {
                    _attributes[key + "-" + name] = value;
                }
            }

            public void AddRange(string message, string? min, string? max)
            {
                _rangeMessage ??= message;
                _rangeMin = min ?? _rangeMin;
                _rangeMax = max ?? _rangeMax;
            }

            public void WriteTo(IDictionary<string, string> attributes)
            {
                if (_rangeMessage != null)
                {
                    Add("range", _rangeMessage, ("min", _rangeMin ?? ""), ("max", _rangeMax ?? ""));
                }

                if (_attributes.Count == 0)
                {
                    return;
                }

                // Like MVC's MergeAttribute: an attribute that is already there (e.g. from DataAnnotations) is kept.
                MergeAttribute(attributes, "data-val", "true");

                foreach (var attribute in _attributes)
                {
                    MergeAttribute(attributes, attribute.Key, attribute.Value);
                }
            }

            private static void MergeAttribute(IDictionary<string, string> attributes, string key, string value)
            {
                if (!attributes.ContainsKey(key))
                {
                    attributes.Add(key, value);
                }
            }
        }
    }
}
