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
            if (viewModel.Title.ToLower() == "abc")
            {
                return FormResult.CreateWarningResult("'Abc' is already exist in the database.");
            }

            try
            {
                //...
                return FormResult.CreateSuccessResult("Product saved.");

                // Success form result with redirect
                //return FormResult.CreateSuccessResult("Product saved.", Url.Action("List", "Home"));

                // Success form result with redirect with delay time (15 seconds)
                // The message will be on the screen for 15 seconds.
                //return FormResult.CreateSuccessResult("Product saved.", Url.Action("List", "Home"), 15000);
            }
            catch
            {
                return FormResult.CreateErrorResult("An error occurred!");
            }

            // CreateSuccessResult Called this usage:
            //return Json(new FormResult(FormResultStatus.Success)
            //{
            //    Message = "Product saved."
            //});
        }

        #endregion

        #region Native Post

        public IActionResult Post()
        {
            return View(new ProductFormViewModel());
        }

        [FormValidator(UseAjax = false, ViewName = "Post")]
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
