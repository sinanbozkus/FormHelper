using FormHelper.Samples.Models;
using Microsoft.AspNetCore.Mvc;

namespace FormHelper.Samples.Controllers
{
    public class HomeController : Controller
    {
        #region Ajax Post

        public IActionResult Index()
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
                //return FormResult.CreateSuccessResult("Product saved.", Url.Action("List", "Home");
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

        public IActionResult IndexPost()
        {
            return View(new ProductFormViewModel());
        }

        [FormValidator(UseAjax = false, ViewName = "IndexPost")]
        public IActionResult SavePost(ProductFormViewModel viewModel)
        {
            // ...

            return View("IndexPost");
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
