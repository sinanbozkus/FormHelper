# Form Helper

Form &amp; Validation Helper for **ASP.NET Core**

Form Helper helps you to create ajax forms and validations without writing any javascript code. **It transforms server-side validations to client-side.** You can also use the form validator without ajax.

**Compatible with Fluent Validation**
(You can add client-side validation support to Fluent Validation.)

[![NuGet](https://img.shields.io/nuget/v/FormHelper.svg)](https://nuget.org/packages/FormHelper) [![Nuget](https://img.shields.io/nuget/dt/FormHelper.svg)](https://nuget.org/packages/FormHelper) [![Gitter](https://badges.gitter.im/formhelper/community.svg)](https://gitter.im/formhelper/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

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

This library works with [jQuery](https://jquery.com)

CDN:
```html
<!-- form helper - You don't need to add these files to your project, just add it. it's embeded! -->
<!-- if you dont't want to use these embeded files, you can download the files from dist folder -->
<!-- You can use formhelper.js/css instead of formhelper.min.js/css to debug. -->
<!-- The bundle file includes jQuery validation and jQuery validation unobtrusive -->

<link rel="stylesheet" href="/formhelper/formhelper.min.css" />
<script src="/formhelper/formhelper.bundle.min.js"></script>
```

## Usage

**Startup.cs**

ConfigureServices:
```
services.AddFormHelper();
```
*With configuration: (optional)*
```
services.AddFormHelper(new FormHelperConfiguration
{
    CheckTheFormFieldsMessage = "Your custom message...",
    RedirectDelay = 6000
});
```
Configure:
```
<!-- If you want to use embeded form helper files, add this line -->
app.UseFormHelper();
```

**ViewImports.cshtml**
```csharp
@using FormHelper
@addTagHelper *, FormHelper
```


**View: (TagHelper)**
```csharp
<form asp-formhelper="true" asp-controller="Home" asp-action="Save">
   // <input...
   // ...
</form>

// You can use <form asp-formhelper="true"> or <formhelper> to activate formhelper.
// Optional parameters:
// asp-callback="...", asp-beforeSubmit="...", asp-dataType="FormData/Json", asp-enableButtonAfterSuccess="false", asp-resetFormAfterSuccess="true" asp-toastrPosition="ToastrPosition.BottomRight"
```

**Controller:**
```csharp
[FormValidator]
public IActionResult Save(FormViewModel viewModel)

// If you use Json data type, you need to add [FromBody] attribute.
// public IActionResult Save([FromBody]FormViewModel viewModel)
```

**Return a result from Controller:**

Error Message:
```
return FormResult.CreateErrorResult("An error occured.");
```
Success Message:
```
return FormResult.CreateSuccessResult("Product saved.");
```
Success Message with Redirect:
```
return FormResult.CreateSuccessResult("Product saved. Please wait...", Url.Action("Home", "Index"));
```
Success Message with Redirect and Delay Time:
```
return FormResult.CreateSuccessResult("Product saved. Please wait...", Url.Action("Home", "Index"), 10000); // 10 seconds
```

**Fill the form fields from a json object:**
```
#("#formId").fillFormFields(yourJsonObject);
```
