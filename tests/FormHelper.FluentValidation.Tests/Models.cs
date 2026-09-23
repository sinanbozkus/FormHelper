using FluentValidation;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace FormHelper.FluentValidation.Tests
{
    public class Registration
    {
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? ConfirmPassword { get; set; }
        public int Age { get; set; }
        public int Quantity { get; set; }
        public int Count { get; set; }
        public string? Code { get; set; }
        public bool HasNickname { get; set; }
        public string? Nickname { get; set; }
        public string? Country { get; set; }
        public string? Tag { get; set; }
        public string? Slug { get; set; }
        public string? Word { get; set; }
        public string? Pattern { get; set; }
        public string? Atomic { get; set; }
        public string? Named { get; set; }
        public string? Letters { get; set; }
        public string? Digits { get; set; }
        public string? EcmaWord { get; set; }
        public string? Backslash { get; set; }
    }

    public class RegistrationValidator : AbstractValidator<Registration>
    {
        public RegistrationValidator()
        {
            RuleFor(x => x.UserName)
                .NotEmpty()
                .MinimumLength(3)
                .MaximumLength(20)
                .MustAsync(NotTakenAsync).WithMessage("This user name is taken.");

            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).NotEmpty().Length(6, 50);
            RuleFor(x => x.ConfirmPassword).Equal(x => x.Password);
            RuleFor(x => x.Age).InclusiveBetween(18, 99);
            RuleFor(x => x.Quantity).GreaterThanOrEqualTo(1).LessThanOrEqualTo(10);
            RuleFor(x => x.Count).NotNull().WithMessage("Count please");
            RuleFor(x => x.Code).Matches("^[A-Z]{3}$");
            RuleFor(x => x.Nickname).NotEmpty().When(x => x.HasNickname);
            RuleFor(x => x.Country).NotEmpty().WithMessage("Please enter {PropertyName}.");
            RuleFor(x => x.Tag).Matches("[A-Z]+");
            RuleFor(x => x.Slug).Matches("abc", RegexOptions.IgnoreCase);
            RuleFor(x => x.Word).Matches("(?i)^abc$");
            RuleFor(x => x.Pattern).Matches(x => x.Tag ?? "");
            RuleFor(x => x.Atomic).Matches("(?>ab|a)c");
            RuleFor(x => x.Named).Matches("^(?<year>[0-9]{4})$");
            RuleFor(x => x.Letters).Matches(@"^\w+$");
            RuleFor(x => x.Digits).Matches(@"^\d{5}$");
            RuleFor(x => x.EcmaWord).Matches(@"^\w+$", RegexOptions.ECMAScript);
            RuleFor(x => x.Backslash).Matches(@"^a\\w$");
        }

        private static async Task<bool> NotTakenAsync(string? userName, CancellationToken cancellationToken)
        {
            await Task.Delay(1, cancellationToken);
            return userName != "taken";
        }
    }
}
