# Migrating from 5.x to 6.0

Form Helper 6.0 is a major release. The client script was rewritten without jQuery, the server side got Razor Pages support, and Fluent Validation support moved to its own package. Most projects only need to change the layout and a few JavaScript calls.

This guide lists every change you may need to make. At the end there is a [prompt for AI assistants](#migrate-with-an-ai-assistant) that can do the migration for you.

## Checklist

1. [Update the packages](#1-packages)
2. [Update Program.cs / Startup.cs](#2-programcs--startupcs)
3. [Update the layout (scripts and styles)](#3-layout)
4. [Update your controllers](#4-controllers)
5. [Update your JavaScript](#5-javascript)
6. [Fluent Validation](#6-fluent-validation)
7. [Check the behavior changes](#7-behavior-changes)

## 1. Packages

```
dotnet add package FormHelper --version 6.0.0
```

The FormHelper package no longer depends on `Newtonsoft.Json`, `Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation` or `Microsoft.Extensions.FileProviders.Embedded`. If your project used one of them without referencing it, add a reference to it yourself.

If you use Fluent Validation, see [step 6](#6-fluent-validation).

## 2. Program.cs / Startup.cs

- Remove the `EmbeddedFiles` option. The files are always embedded now.
- Call `app.UseFormHelper()`. It serves the scripts and styles under `/formhelper/`.

```csharp
builder.Services.AddControllersWithViews().AddFormHelper(options =>
{
    options.CheckTheFormFieldsMessage = "Please check the form fields.";
    options.ToastrDefaultPosition = ToastrPosition.TopFullWidth;
});

app.UseStaticFiles();
app.UseFormHelper();
```

`FormHelperOptions` isn't registered as a service anymore. If you inject it, inject `IOptions<FormHelperOptions>` instead.

New options: `InvalidRequestMessage`, `ErrorMessage`, `ClientValidation`, `InputErrorCssClass`, `MessageErrorCssClass`, `LocalizationResourceType` and `JsonSerializerOptions`. See the [README](README.md#global-options).

## 3. Layout

Replace the script and style tags with the tag helpers. They add a version hash, so browsers never use an old file after an update.

```cshtml
<head>
    <formhelper-styles />
</head>
<body>
    ...
    <!-- With jQuery: load jQuery first. The bundle includes jQuery Validation and jQuery Validation Unobtrusive. -->
    <script src="~/lib/jquery/dist/jquery.min.js"></script>
    <formhelper-scripts bundle="true" />

    <!-- Without jQuery -->
    <formhelper-scripts />
</body>
```

- `formhelper.js` doesn't need jQuery anymore.
- The bundle skips jQuery Validation and Unobtrusive when the page already has them. You can keep `_ValidationScriptsPartial`.
- `/formhelper/jquery.validate.min.js` and `/formhelper/jquery.validate.unobtrusive.min.js` are no longer served. Use the bundle or your own copies.
- The `dist` folder was removed from the repository.

## 4. Controllers

### Return types

The `FormResult.Create...Result` methods return `FormResult` (an `IActionResult`) instead of `JsonResult`:

```csharp
public IActionResult Save(ProductViewModel model)
{
    return FormResult.CreateSuccessResult("Product saved.");
}
```

If an action is declared as `JsonResult`, or you read `.Value` from the result, change it to `IActionResult` / `FormResult`.

### JSON

`FormResult` writes its own JSON, always in camelCase, whatever JSON settings your application uses. The object you pass with `Create...ResultWithObject` is written with `FormHelperOptions.JsonSerializerOptions` (camelCase, nulls ignored). If your JavaScript reads `result.object.ProductId`, change it to `result.object.productId`, or set `JsonSerializerOptions` to match your naming.

### Validation errors

`FormResultValidationError.Message` (a string) is now `Messages` (a list). In JSON, `validationErrors` is `[{ "propertyName": "Title", "messages": ["..."] }]`.

To return the model state after your own checks, use the new `FormResult.CreateValidationErrorResult(ModelState)`.

### Messages are text

Messages are shown as text, not HTML. Use `\n` for a line break instead of `<br>`:

```csharp
return FormResult.CreateErrorResult("The product could not be saved.\nPlease try again.");
```

If you need HTML that you trust (never user input) in notifications, set `FormHelper.configure({ toastr: { escapeHtml: false } })`.

### [FormValidator]

- It's no longer an `ActionFilterAttribute`. If you subclassed it and overrode `OnActionExecuting`, implement `IFormModelValidator` instead ([README](README.md#custom-server-side-validation)).
- GET requests are no longer validated.
- It works on Razor Pages: put it on the PageModel class.

### FormConfig (html helper)

`FormConfig.FormTitle` was removed. It was never used by Form Helper. Write the title in your view.

## 5. JavaScript

### Form attributes

The tag helper and the html helper now write `data-formhelper` and `data-fh-*` attributes instead of `formhelper`, `dataType`, `callback`, etc. If you wrote these attributes by hand or used them in CSS selectors, use the tag helper or the new names:

```css
/* 5.x: form[formhelper] */
form[data-formhelper] { }
```

### beforeSubmit

The function gets `(form, request)`. It can be async. Return `false` to cancel. `request` is `{ url, method, headers, body }` and can be changed:

```js
function beforeProductSave(form, request) {
    request.headers["X-Tenant"] = "42";
    return confirm("Save?");
}
```

### callback

The function gets `(result, form)`. `result.validationErrors[i].messages` is an array.

### Methods

| 5.x | 6.0 |
|---|---|
| `$("#form").fillFormFields(data, callbacks)` | `FormHelper.fill("#form", data, callbacks)` |
| `$("#form").fhReset()` | `FormHelper.reset("#form")` |
| `fhToastr.information("...")` | `fhToastr.info("...")` |

The `FormHelper` methods accept an element, a selector or a jQuery object.

### fhToastr

- It doesn't need jQuery. It uses CSS transitions, so the jQuery animation options (`showMethod`, `hideMethod`, `showEasing`, `hideEasing`) were removed. `showDuration` and `hideDuration` still work.
- Messages are text. Pass `{ escapeHtml: false }` to show HTML you trust.
- The CSS class names didn't change, so your style overrides keep working.

### New

DOM events (`formhelper:success`, `formhelper:error`...), `FormHelper.submit`, `FormHelper.validate`, `FormHelper.showErrors`, `FormHelper.configure` and custom validation rules. See the [README](README.md#javascript-api).

## 6. Fluent Validation

Fluent Validation support is now in the **FormHelper.FluentValidation** package. It replaces FluentValidation.AspNetCore, which is deprecated.

```
dotnet add package FormHelper.FluentValidation
dotnet remove package FluentValidation.AspNetCore
```

```csharp
// 5.x
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<ProductValidator>();

// 6.0
builder.Services.AddValidatorsFromAssemblyContaining<ProductValidator>();
builder.Services.AddFormHelperFluentValidation();
```

(With older FluentValidation versions this was `AddFluentValidation(fv => fv.RegisterValidatorsFromAssemblyContaining<...>())`.)

- `AddValidatorsFromAssemblyContaining` comes from the FluentValidation.DependencyInjectionExtensions package. Add it if you don't have it.
- Only `[FormValidator]` actions and pages are validated. If other actions relied on FluentValidation.AspNetCore's auto validation, validate them yourself (`await validator.ValidateAsync(model)`) or keep FluentValidation.AspNetCore. When it is still registered, FormHelper.FluentValidation doesn't validate a second time.
- Async rules (`MustAsync`, `CustomAsync`) are supported.
- Some `Matches` rules are now checked on the server only, because the browser would give a different result: patterns with `RegexOptions` (e.g. `IgnoreCase`), with `\w`, `\d` or `\b` (they also match letters like "ç" in .NET, but not in JavaScript), or with .NET-only syntax. Their messages appear after the post. Use explicit ranges such as `[0-9]` to keep them in the browser. `Matches` also finds the pattern anywhere in the value in the browser now, like on the server.

## 7. Behavior changes

These need no code changes, but you may notice them:

- Returning `RedirectToAction`, `RedirectToPage`, `Redirect` or `LocalRedirect` from a Form Helper post goes to that page. In 5.x the redirect was ignored.
- Server messages appear under the fields and in the validation summary (`<div asp-validation-summary="All">`). Messages of fields without an `asp-validation-for` element are shown in a notification.
- When the response isn't a FormResult (e.g. a 500 error page), the notification shows "An error occurred. Please try again." and the details are written to the browser console. Change the text with the `ErrorMessage` option.
- An invalid or missing antiforgery token returns a FormResult with `InvalidRequestMessage` and status code 400, so the user sees a message. In 5.x it was an unhandled exception.
- With jQuery Validation, the message of a `[Remote]` action is shown as text, like every other server message. jQuery Validation alone would render it as HTML.
- On screens narrower than 768px, notifications use the full width. 5.x detected phones by their user agent.
- `ToastrPosition.TopCenter` now uses the right CSS class.

## Migrate with an AI assistant

Copy the prompt below into your AI coding assistant (Claude Code, GitHub Copilot, Cursor...) in your project:

````text
Migrate this ASP.NET Core project from FormHelper 5.x to FormHelper 6.0.0.
Follow the official guide: https://github.com/sinanbozkus/FormHelper/blob/master/MIGRATION.md
Only change what the migration needs. Show me a summary of the changes when you are done.

1. Packages: update FormHelper to 6.0.0. If the project uses FluentValidation.AspNetCore, replace it with
   FormHelper.FluentValidation 6.0.0 (add FluentValidation.DependencyInjectionExtensions if missing).
   If the project used Newtonsoft.Json, Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation or
   Microsoft.Extensions.FileProviders.Embedded only through FormHelper, add a direct reference to it.

2. Startup/Program.cs:
   - Remove `options.EmbeddedFiles`.
   - Make sure `app.UseFormHelper()` is called (after UseStaticFiles).
   - Replace AddFluentValidationAutoValidation / AddFluentValidationClientsideAdapters / AddFluentValidation(...)
     with `services.AddValidatorsFromAssemblyContaining<AnyValidator>()` and `services.AddFormHelperFluentValidation()`.
     Note: only [FormValidator] actions are validated now. List the actions that relied on auto validation without
     [FormValidator] and ask me how to handle them.
   - Where FormHelperOptions is injected, inject IOptions<FormHelperOptions> instead.

3. Layouts and views:
   - Replace <script src=".../formhelper*.js"> with <formhelper-scripts bundle="true" /> when the page uses jQuery
     (jQuery must be loaded before it), otherwise <formhelper-scripts />.
   - Replace <link href=".../formhelper*.css"> with <formhelper-styles />.
   - Remove references to /formhelper/jquery.validate.min.js and /formhelper/jquery.validate.unobtrusive.min.js
     (the bundle includes them) and to FormHelper's dist folder.
   - Remove FormTitle from `new FormConfig(...)` and write the title in the view.
   - Replace selectors like form[formhelper] with form[data-formhelper].

4. C#:
   - Actions or handlers returning FormResult.Create...Result() and declared as JsonResult: change to IActionResult.
   - FormResultValidationError.Message (string) is now Messages (List<string>).
   - "<br>" inside FormResult messages: replace with "\n" (messages are shown as text).
   - Classes deriving from FormValidator that override OnActionExecuting: move the logic to an IFormModelValidator.

5. JavaScript (views and .js files):
   - $(x).fillFormFields(data, callbacks) -> FormHelper.fill(x, data, callbacks)
   - $(x).fhReset() -> FormHelper.reset(x)
   - fhToastr.information( -> fhToastr.info(
   - beforeSubmit functions (asp-beforeSubmit / FormConfig.BeforeSubmit) now receive (form, request) instead of
     (jqXHR, settings, $form). Rewrite code that used jqXHR/settings: request is { url, method, headers, body }.
     Returning false still cancels.
   - callback functions receive (result, form). Code reading result.validationErrors[i].message must read
     result.validationErrors[i].messages (an array).
   - Code reading PascalCase properties of result.object (e.g. result.object.ProductId) must use camelCase
     (result.object.productId).
   - fhToastr options showMethod, hideMethod, showEasing, hideEasing no longer exist; remove them.
   - Messages containing HTML passed to fhToastr: they are escaped now. If the HTML is trusted, pass
     { escapeHtml: false }, otherwise convert it to text.

Build the project when you are done and fix any compile errors caused by the migration.
````
