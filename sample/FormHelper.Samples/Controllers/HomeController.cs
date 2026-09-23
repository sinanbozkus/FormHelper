using FormHelper.Samples.Models;
using Microsoft.AspNetCore.Mvc;

namespace FormHelper.Samples.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return RedirectToAction(nameof(TagHelper));
        }

        #region Ajax Post

        public IActionResult TagHelper()
        {
            return View(new ProductFormViewModel());
        }

        public IActionResult HtmlHelper()
        {
            return View(new ProductFormViewModel());
        }

        [HttpPost, FormValidator]
        public IActionResult Save(ProductFormViewModel viewModel)
        {
            // sample scenario: same name checking in the database
            if (viewModel.Title?.ToLower() == "abc")
            {
                return FormResult.CreateWarningResult("'Abc' is already exist in the database.");
            }

            try
            {
                //...
                return FormResult.CreateSuccessResult("Product saved.");

                // Success form result with redirect
                // return FormResult.CreateSuccessResult("Product saved.", Url.Action("List", "Home"));

                // Success form result with redirect with delay time (15 seconds)
                // The message will be on the screen for 15 seconds.
                // return FormResult.CreateSuccessResult("Product saved.", Url.Action("List", "Home"), 15000);
            }
            catch
            {
                return FormResult.CreateErrorResult("An error occurred!");
            }
        }

        #endregion

        #region Without jQuery (built-in validator, JSON)

        public IActionResult WithoutJQuery()
        {
            return View(new ProductFormViewModel());
        }

        // Json data type: the model comes from the request body.
        [HttpPost, FormValidator]
        public IActionResult SaveJson([FromBody] ProductFormViewModel viewModel)
        {
            if (viewModel.Title?.ToLower() == "abc")
            {
                ModelState.AddModelError(nameof(viewModel.Title), "'Abc' is already exist in the database.");
                return FormResult.CreateValidationErrorResult(ModelState);
            }

            return FormResult.CreateSuccessResultWithObject(viewModel, $"Product saved: {viewModel.Title} ({viewModel.Category}), active: {viewModel.Active}");
        }

        #endregion

        #region Remote validation

        // Used by [Remote] on ProductFormViewModel.Title. The field is posted as "Title",
        // or "Input.Title" from the Razor Page, so it is read from the query by its suffix.
        public IActionResult CheckTitle()
        {
            var title = Request.Query.FirstOrDefault(q => q.Key.EndsWith("Title", StringComparison.OrdinalIgnoreCase)).Value.ToString();

            return title.ToLower() == "abc"
                ? Json("'Abc' is already exist in the database.")
                : Json(true);
        }

        #endregion

        #region Native Post

        public IActionResult Post()
        {
            return View(new ProductFormViewModel());
        }

        [HttpPost, FormValidator(UseAjax = false, ViewName = "Post")]
        public IActionResult SavePost(ProductFormViewModel viewModel)
        {
            // ...

            return View("Post", new ProductFormViewModel());
        }

        #endregion

        #region Remote Modal

        public IActionResult Modal()
        {
            return PartialView("ModalPartial", new ProductFormViewModel());
        }

        #endregion
    }
}
