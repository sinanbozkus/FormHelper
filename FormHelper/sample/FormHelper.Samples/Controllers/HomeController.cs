using FormHelper.Attributes;
using FormHelper.Enums;
using FormHelper.Samples.Models;
using FormHelper.Types;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace FormHelper.Samples.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View(new ProductFormViewModel());
        }


        [FormValidator]
        public IActionResult Save(ProductFormViewModel viewModel)
        {
            // sample scenario: same name checking in the database 
            if(viewModel.Title.ToLower() == "abc")
            {
                return Json(new FormResult
                {
                    Status = FormResultStatus.Warning,
                    Message = "'Abc' is already exist in the database."
                });
            }

            return FormResult.CreateSuccessResult("Product saved.");

            // CreateSuccessResult Called this usage:
            //return Json(new FormResult
            //{
            //    Status = FormResultStatus.Success,
            //    Message = "Product saved."
            //});
        }






        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
