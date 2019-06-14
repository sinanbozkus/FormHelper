# Form Helper

Form &amp; Validation Helper for **ASP.NET Core**

FormHelper helps you to create ajax forms and validations without writing any javascript code. **It transforms server-side validations to client-side.** You can also use the form validator without ajax.

**Compatible with Fluent Validation**
(You can add client-side validation support to Fluent Validation.)

[![NuGet](https://img.shields.io/nuget/v/FormHelper.svg)](https://nuget.org/packages/FormHelper) [![Nuget](https://img.shields.io/nuget/dt/FormHelper.svg)](https://nuget.org/packages/FormHelper)

<p align="center">
<img src="http://www.sinanbozkus.com/nuget/formhelper/formhelper-screenshot.png" alt="FormHelper" />
</p>

## Installation

FormHelper can be installed using the *Nuget Package Manager* or the *dotnet CLI*.

Package Manager:
```
Install-Package FormHelper
```

dotnet CLI:
```csharp
dotnet add package FormHelper
```

This library depends on some packages:
- [jQuery Validation](https://github.com/jquery-validation/jquery-validation)
- [Toastr](https://github.com/CodeSeven/toastr)

CDN:
```html
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.19.0/jquery.validate.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery-validation-unobtrusive/3.2.11/jquery.validate.unobtrusive.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js"></script>

```

## Usage

**Startup.cs**
```
services.AddFormHelper();
```
With configuration: (optional)
```
services.AddFormHelper(new FormHelperConfiguration
{
    UsePascalCaseJson = true,
    CheckTheFormFieldsMessage = "Your custom message...",
    RedirectDelay = 6000,
    DebugMode = true
});
```

**View:**
```csharp
var formConfig = new FormConfig(ViewContext)
{
    FormId = "ProductForm",
    FormTitle = "New Product",
    BeforeSubmit = "ProductFormBeforeSubmit", // optional
    Callback = "ProductFormCallback" // optional,
};

// <form id="@formConfig.FormId" asp-controller="Home" asp-action="Save"
// ...

@await Html.RenderFormScript(formConfig)
```

**Controller:**
```csharp
[HttpPost, FormValidator]
public IActionResult Save(FormViewModel viewModel)
```

**Return a result from Controller:**

Error Message:
```
return FormResult.CreateErrorResult("An error occured.");
```
Warning Message:
```
return FormResult.CreateWarningResult("'ABC' is already exist in the database.");
```
Info Message:
```
return FormResult.CreateInfoResult("Happy new year!");
```
Success Message:
```
return FormResult.CreateSuccessResult("Product saved.");
```
Success Message with Redirect:
```
return FormResult.CreateSuccessResult("Product saved. Please wait...", Url.Action("Home", "Index"));
```

## Blog Posts
>**English:**<br>
>English Posts are not ready yet. But you can look the samples. It's so easy to use.
>
>**Turkish:**<br>
>[FormHelper ve Fluent Validation kullanarak ASP.NET Core Validation İşlemleri](http://www.sinanbozkus.com/form-helper-ve-fluent-validation-kullanarak-asp-net-core-validation-islemleri/)

