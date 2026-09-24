using FluentValidation;
using FormHelper.Samples.Models;

namespace FormHelper.Samples.Validators
{
    public class ProductFormViewModelValidator : AbstractValidator<ProductFormViewModel>
    {
        // Fluent Validation
        // A popular .NET library for building strongly-typed validation rules.
        // GitHub: https://github.com/FluentValidation/FluentValidation

        public ProductFormViewModelValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .MinimumLength(3)
                .MaximumLength(15)
                .NotEqual("hello")
                // Async rules (e.g. a database check) run on the server; the result is shown under the field.
                .MustAsync(async (title, cancellationToken) =>
                {
                    await Task.Delay(50, cancellationToken);
                    return !string.Equals(title, "admin", StringComparison.OrdinalIgnoreCase);
                })
                .WithMessage("'admin' is a reserved name.");

            RuleFor(x => x.Category)
                .NotEmpty();

            RuleFor(x => x.InStock)
                .NotEqual(0).When(x => x.Active).WithMessage("'In Stock' must not be equal to '0' when the product is active.");
        }
    }
}
