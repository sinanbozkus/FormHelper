using FormHelper.Samples.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FormHelper.Samples.Pages
{
    // Razor Pages: put [FormValidator] on the PageModel (filters on handler methods are not supported by Razor Pages).
    [FormValidator]
    public class ProductModel : PageModel
    {
        [BindProperty]
        public ProductFormViewModel Input { get; set; } = new ProductFormViewModel();

        public void OnGet()
        {
        }

        public IActionResult OnPost()
        {
            if (Input.InStock > 50)
            {
                // A model-level error: shown in the validation summary.
                ModelState.AddModelError("", "The warehouse can't hold more than 50 items.");
                return FormResult.CreateValidationErrorResult(ModelState);
            }

            return FormResult.CreateSuccessResult("Product saved.", Url.Page("/Product"), 3000);
        }
    }
}
