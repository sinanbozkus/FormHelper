using System.Globalization;
using System.Reflection;
using Xunit.Sdk;

namespace FormHelper.FluentValidation.Tests
{
    public sealed class UseCultureAttribute : BeforeAfterTestAttribute
    {
        private readonly CultureInfo _culture;
        private CultureInfo _originalCulture = null!;
        private CultureInfo _originalUICulture = null!;

        public UseCultureAttribute(string culture)
        {
            _culture = new CultureInfo(culture);
        }

        public override void Before(MethodInfo methodUnderTest)
        {
            _originalCulture = CultureInfo.CurrentCulture;
            _originalUICulture = CultureInfo.CurrentUICulture;
            CultureInfo.CurrentCulture = _culture;
            CultureInfo.CurrentUICulture = _culture;
        }

        public override void After(MethodInfo methodUnderTest)
        {
            CultureInfo.CurrentCulture = _originalCulture;
            CultureInfo.CurrentUICulture = _originalUICulture;
        }
    }
}
