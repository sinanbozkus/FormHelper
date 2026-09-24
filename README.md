# Form Helper

Form & validation helper for **ASP.NET Core MVC and Razor Pages**.

Form Helper posts your forms with ajax and **brings your server-side validation to the browser**, without writing any JavaScript. Validation errors are shown under their fields and results as notifications. It works with or without jQuery.

**Works with Fluent Validation** through the [FormHelper.FluentValidation](#fluent-validation) package, including client-side validation and async rules.

If you like this library, please give it a star. :star:

[![NuGet](https://img.shields.io/nuget/v/FormHelper.svg)](https://www.nuget.org/packages/FormHelper) [![Downloads](https://img.shields.io/nuget/dt/FormHelper.svg)](https://www.nuget.org/packages/FormHelper) [![Build](https://github.com/sinanbozkus/FormHelper/actions/workflows/ci.yml/badge.svg)](https://github.com/sinanbozkus/FormHelper/actions/workflows/ci.yml)

<p align="center">
  <img src="https://raw.githubusercontent.com/sinanbozkus/FormHelper/master/docs/screenshot.png" alt="Form Helper" width="640" />
</p>

- Ajax forms (form data, files or JSON) with no JavaScript of your own.
- Server-side validation errors (DataAnnotations, Fluent Validation, your own checks) shown under their fields.
- Client-side validation from the same rules, with jQuery Validation or the built-in validator (no jQuery needed).
- Success, info, warning and error notifications, optional redirect after a result.
- Antiforgery token validation.
- MVC and Razor Pages, .NET Core 3.1 to .NET 10.

Upgrading from 5.x? See the [migration guide](https://github.com/sinanbozkus/FormHelper/blob/master/MIGRATION.md).

## Contents

- [Installation](#installation)
- [Getting started](#getting-started)
- [Scripts and styles](#scripts-and-styles)
- [Returning results](#returning-results)
- [Razor Pages](#razor-pages)
- [Form options](#form-options)
- [Global options](#global-options)
- [Client-side validation](#client-side-validation)
- [Validation messages and styling](#validation-messages-and-styling)
- [JSON requests](#json-requests)
- [Normal (non-ajax) posts](#normal-non-ajax-posts)
- [Fluent Validation](#fluent-validation)
- [Custom server-side validation](#custom-server-side-validation)
- [JavaScript API](#javascript-api)
- [Notifications (fhToastr)](#notifications-fhtoastr)
- [Localization](#localization)
- [Security](#security)
- [Building and testing](#building-and-testing)

## Installation

```
dotnet add package FormHelper
```

For Fluent Validation support, also add:

```
dotnet add package FormHelper.FluentValidation
```

Supported: .NET Core 3.1, .NET 5, 6, 7, 8, 9 and 10. The FormHelper package has no dependencies.

## Getting started

**1. Program.cs**

```csharp
using FormHelper;

builder.Services.AddControllersWithViews().AddFormHelper();

var app = builder.Build();

app.UseStaticFiles();
app.UseFormHelper(); // serves formhelper.js and formhelper.css under /formhelper/
app.UseRouting();
```

With options:

```csharp
builder.Services.AddControllersWithViews().AddFormHelper(options =>
{
    options.CheckTheFormFieldsMessage = "Please check the form fields.";
    options.RedirectDelay = 3000;
    options.ToastrDefaultPosition = ToastrPosition.TopFullWidth;
    options.InputErrorCssClass = "is-invalid"; // Bootstrap
});
```

On .NET Core 3.1 / .NET 5, call `AddFormHelper()` in `Startup.ConfigureServices` and `app.UseFormHelper()` in `Startup.Configure`.

**2. _ViewImports.cshtml**

```cshtml
@using FormHelper
@addTagHelper *, FormHelper
```

**3. _Layout.cshtml**

```cshtml
<head>
    ...
    <formhelper-styles />
</head>
<body>
    ...
    <formhelper-scripts />
</body>
```

Using jQuery Validation? See [Scripts and styles](#scripts-and-styles).

**4. The form**

```cshtml
<form asp-formhelper="true" asp-controller="Product" asp-action="Save">
    <input asp-for="Title" />
    <span asp-validation-for="Title"></span>

    <button type="submit">Save</button>
</form>
```

**5. The action**

```csharp
[HttpPost, FormValidator]
public IActionResult Save(ProductViewModel model)
{
    // The model is valid here. When it isn't, [FormValidator] returns the errors to the form.

    return FormResult.CreateSuccessResult("Product saved.");
}
```

That's it. The form is posted with ajax. Validation errors appear under their fields and the result appears as a notification.

## Scripts and styles

The files are embedded in the package and served by `app.UseFormHelper()`. The tag helpers add a version hash to the url, so browsers cache the files and pick up a new version right away.

| Tag helper | File | Use it when |
|---|---|---|
| `<formhelper-scripts />` | `formhelper.min.js` | You don't use jQuery, or you already load jQuery Validation yourself. |
| `<formhelper-scripts bundle="true" />` | `formhelper.bundle.min.js` | You use jQuery. It also has jQuery Validation and jQuery Validation Unobtrusive. Load jQuery before it. |
| `<formhelper-styles />` | `formhelper.min.css` | Always, for the notifications. |

Add `minified="false"` to get the non-minified files while debugging.

- `formhelper.js` has no dependencies. It works with or without jQuery.
- The bundle skips jQuery Validation and Unobtrusive when they are already on the page (e.g. from `_ValidationScriptsPartial`), so your custom rules keep working.
- jQuery 3 and jQuery 4 are supported.

```cshtml
<!-- with jQuery -->
<script src="~/lib/jquery/dist/jquery.min.js"></script>
<formhelper-scripts bundle="true" />
```

You can also reference the files directly: `/formhelper/formhelper.min.js`, `/formhelper/formhelper.bundle.min.js`, `/formhelper/formhelper.min.css`.

To host the files yourself, download them from the [GitHub releases](https://github.com/sinanbozkus/FormHelper/releases).

## Returning results

Return a `FormResult` from the action (or Razor Page handler):

```csharp
return FormResult.CreateSuccessResult("Product saved.");
return FormResult.CreateInfoResult("Nothing changed.");
return FormResult.CreateWarningResult("Saved, but the stock is low.");
return FormResult.CreateErrorResult("The product could not be saved.");

// Redirect after the message (the default delay is 1500 ms, see RedirectDelay)
return FormResult.CreateSuccessResult("Product saved.", Url.Action("Index"));
return FormResult.CreateSuccessResult("Product saved.", Url.Action("Index"), 5000);

// Redirect without a message
return FormResult.CreateSuccessResult(null, Url.Action("Index"));

// Send data to the client (callback / events: result.object)
return FormResult.CreateSuccessResultWithObject(new { product.Id }, "Product saved.");
```

The usual redirect results work too. `[FormValidator]` sends them to the script as a redirect:

```csharp
return RedirectToAction("Index");
return RedirectToPage("/Products/Index");
```

The browser follows other redirects itself: redirects from actions without `[FormValidator]`, and redirects that keep the method (`RedirectToActionPreserveMethod` etc., 307/308), which are repeated with the same method and body. When such a redirect ends on a FormResult, it is handled as usual. When it ends on a page, the script opens that page with a GET request, so that page must accept GET.

When you validate something yourself, return the model state. The messages appear under their fields:

```csharp
if (await _products.TitleExistsAsync(model.Title))
{
    ModelState.AddModelError(nameof(model.Title), "This title is already used.");
    return FormResult.CreateValidationErrorResult(ModelState);
}
```

Model-level errors (`ModelState.AddModelError("", "...")`) become the result's message, and they also appear in the validation summary if the form has one.

`FormResult` is an `IActionResult`. It writes its own camelCase JSON, whatever JSON settings your application uses. `result.StatusCode` sets the HTTP status code (default 200).

## Razor Pages

Put `[FormValidator]` on the PageModel class. Razor Pages don't run filters on handler methods.

```csharp
[FormValidator]
public class ProductModel : PageModel
{
    [BindProperty]
    public ProductViewModel Input { get; set; } = new();

    public IActionResult OnPost()
    {
        return FormResult.CreateSuccessResult("Product saved.", Url.Page("/Products/Index"));
    }
}
```

```cshtml
<form method="post" asp-formhelper="true">
    <input asp-for="Input.Title" />
    <span asp-validation-for="Input.Title"></span>
    <button type="submit">Save</button>
</form>
```

In Program.cs: `builder.Services.AddRazorPages().AddFormHelper();`

## Form options

Attributes of `<form asp-formhelper="true">`. `<formhelper asp-controller="..." asp-action="...">` works too.

| Attribute | Default | Description |
|---|---|---|
| `asp-dataType` | `FormData` | `FormData` (supports files) or `Json`. See [JSON requests](#json-requests). |
| `asp-callback` | | Name of a function called with `(result, form)` after the response. Dotted names work: `app.products.saved`. |
| `asp-beforeSubmit` | | Name of a function called with `(form, request)` before the request. Return `false` to cancel. |
| `asp-enableButtonAfterSuccess` | `false` | Enables the submit button again after a successful result. |
| `asp-resetFormAfterSuccess` | `true` | Resets the form after a successful result. |
| `asp-toastrPosition` | `TopRight` | Position of the notifications: `TopRight`, `TopLeft`, `TopCenter`, `TopFullWidth`, `BottomRight`, `BottomLeft`, `BottomCenter`, `BottomFullWidth`. |
| `asp-checkTheFormFieldsMessage` | | Message shown when the form has validation errors. Overrides the global option. |
| `asp-validation` | `Auto` | Client-side validation: `Auto`, `JQuery`, `BuiltIn` or `None`. See [Client-side validation](#client-side-validation). |

```cshtml
<form asp-formhelper="true" asp-controller="Product" asp-action="Save"
      asp-callback="productSaved" asp-resetFormAfterSuccess="false" asp-toastrPosition="BottomRight">
```

```js
function productSaved(result, form) {
    if (result.isSucceed) {
        console.log(result.object);
    }
}
```

### Html helper

If you can't use the tag helper, render the attributes with a script after the form:

```cshtml
@{
    var formConfig = new FormConfig(ViewContext)
    {
        FormId = "productForm",
        Callback = "productSaved",
        DataType = FormDataType.Json
    };
}

<form id="productForm" asp-controller="Product" asp-action="Save">
    ...
</form>

@Html.RenderFormScript(formConfig)
```

## Global options

`AddFormHelper(options => ...)`:

| Option | Default | Description |
|---|---|---|
| `CheckTheFormFieldsMessage` | `"Check the form fields."` | Shown when the form has validation errors. |
| `InvalidRequestMessage` | `"Your session has expired. Please refresh the page and try again."` | Shown when the antiforgery token is missing or invalid. |
| `ErrorMessage` | `"An error occurred. Please try again."` | Shown when the response isn't a FormResult (e.g. the error page of an unhandled exception). The details are written to the browser console. |
| `RedirectDelay` | `1500` | Milliseconds before redirecting when a result has both a message and a redirect url. |
| `ToastrDefaultPosition` | `TopRight` | Default position of the notifications. |
| `ClientValidation` | `Auto` | Default client-side validation engine. |
| `InputErrorCssClass` | | Extra class(es) for an invalid input, e.g. `is-invalid`. |
| `MessageErrorCssClass` | | Extra class(es) for a field's error message, e.g. `invalid-feedback d-block`. |
| `LocalizationResourceType` | | Localizes the three messages above. See [Localization](#localization). |
| `JsonSerializerOptions` | camelCase, nulls ignored | Serializer options of `FormResult`. They affect how `Object` is written. |

## Client-side validation

Form Helper validates the form in the browser with the `data-val-*` attributes ASP.NET Core renders for your model (DataAnnotations, Fluent Validation rules via FormHelper.FluentValidation, `[Remote]`). The server validates again with `[FormValidator]`, so rules that can't run in the browser are still checked.

| Engine | |
|---|---|
| `Auto` (default) | jQuery Validation Unobtrusive when it is on the page, otherwise the built-in validator. |
| `JQuery` | jQuery Validation Unobtrusive. Falls back to the built-in validator (with a console warning) when it isn't loaded. |
| `BuiltIn` | The built-in validator, even when jQuery Validation is on the page. |
| `None` | No client-side validation. Only the server validates. |

The built-in validator supports `required`, `length`, `minlength`, `maxlength`, `range`, `number` (accepts `1.5` and `1,5`), `regex`, `email`, `url`, `phone`, `creditcard`, `equalto`, `fileextensions` and `remote`. For a multiple select or a group of checkboxes, `length`, `minlength` and `maxlength` count the selected items, like `[MinLength]` and `[MaxLength]` on a collection. Fields are validated when they lose focus. A field that shows an error is validated again while you type.

`[RegularExpression]` patterns run as JavaScript regular expressions in the browser, as with jQuery Validation. There `\w`, `\d` and `\b` are ASCII-only (in .NET they also match letters like "ç"), so prefer explicit ranges such as `[a-zA-ZçğıöşüÇĞİÖŞÜ]` for such fields.

Add your own rule for a custom `data-val-*` attribute:

```js
// <input data-val="true" data-val-uppercase="Use upper case letters." ...>
FormHelper.validation.addRule("uppercase", (value, element, params, form) => value === value.toUpperCase());
```

A rule returns `true` (valid), `false` (shows the attribute's message), a message, or a Promise of one of these. With jQuery Validation, add the rule with `jQuery.validator.addMethod` and `jQuery.validator.unobtrusive.adapters` as usual.

### [Remote]

`[Remote]` works with both engines. The action returns `true`, `false` or an error message:

```csharp
[Remote("CheckTitle", "Product")]
public string Title { get; set; }

[AcceptVerbs("GET", "POST")]
public IActionResult CheckTitle(string title)
    => Json(_products.TitleExists(title) ? $"'{title}' is already used." : (object)true);
```

## Validation messages and styling

Form Helper uses ASP.NET Core's validation markup and CSS classes:

- An invalid input gets `input-validation-error` and `aria-invalid="true"`.
- `<span asp-validation-for="Title">` shows the field's messages, with `field-validation-error`.
- `<div asp-validation-summary="All">` (or any element with `data-fh-summary` in the form) lists all messages.

Messages for fields that have no `asp-validation-for` element are shown in a notification when the form has no validation summary.

Add your CSS framework's classes with `InputErrorCssClass` and `MessageErrorCssClass`:

```csharp
// Bootstrap 5
options.InputErrorCssClass = "is-invalid";
options.MessageErrorCssClass = "invalid-feedback d-block";

// Tailwind CSS
options.InputErrorCssClass = "border-red-500 focus:ring-red-500";
options.MessageErrorCssClass = "mt-1 text-sm text-red-600";
```

A validation summary is always rendered. When it has no errors it has the `validation-summary-valid` class. If you style the summary as a box (e.g. `class="alert alert-danger"`), hide it while it is empty:

```css
.validation-summary-valid {
    display: none;
}
```

## JSON requests

With `asp-dataType="Json"` the form is sent as JSON. Add `[FromBody]` to the parameter:

```csharp
[HttpPost, FormValidator]
public IActionResult Save([FromBody] ProductViewModel model)
```

Checkboxes are sent as `true`/`false`, multiple values as arrays, `Address.City` style names as nested objects, and empty values as `null`. Other values are sent as strings. Files can't be sent as JSON; use `FormData` for file uploads.

On .NET Core 3.1, System.Text.Json can't read numbers from strings (it can since .NET 5). Use `FormData` there, or `AddNewtonsoftJson()`.

## Normal (non-ajax) posts

`[FormValidator]` can also validate normal form posts. It re-renders the view with the errors when the model is invalid:

```csharp
[HttpPost, FormValidator(UseAjax = false)]
public IActionResult Save(ProductViewModel model)
{
    // valid here
    return RedirectToAction("Index");
}
```

Don't add `asp-formhelper` to such a form. Set `ViewName` when the view name differs from the action name. Razor Pages render the page again.

`[FormValidator]` options:

| Option | Default | Description |
|---|---|---|
| `UseAjax` | `true` | `true`: the request must come from Form Helper's script and errors are returned as JSON. `false`: a normal post. |
| `ValidateAntiforgeryToken` | `true` | Validates the antiforgery token. |
| `ViewName` | | MVC with `UseAjax = false`: the view rendered when the model is invalid. |

GET requests are not validated.

## Fluent Validation

The **FormHelper.FluentValidation** package validates the models of `[FormValidator]` actions and pages with your Fluent Validation validators. It also sends the rules that can run in the browser to the client.

```
dotnet add package FormHelper.FluentValidation
```

```csharp
builder.Services.AddControllersWithViews().AddFormHelper();

builder.Services.AddValidatorsFromAssemblyContaining<ProductValidator>();
builder.Services.AddFormHelperFluentValidation();
```

```csharp
public class ProductValidator : AbstractValidator<ProductViewModel>
{
    public ProductValidator(IProductRepository products)
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(100)
            .MustAsync(async (title, cancellation) => !await products.TitleExistsAsync(title))
            .WithMessage("This title is already used.");
    }
}
```

- Works with FluentValidation 11 and 12. You don't need the deprecated FluentValidation.AspNetCore package.
- Only `[FormValidator]` actions and pages are validated, and async rules are supported.
- These rules also run in the browser: `NotNull`, `NotEmpty`, `Length`, `MinimumLength`, `MaximumLength`, `Matches` (see below), `EmailAddress`, `CreditCard`, `InclusiveBetween`, `GreaterThanOrEqualTo`/`LessThanOrEqualTo` a constant, and `Equal` to another property. Messages are localized by Fluent Validation.
- Other rules (`Must`, `MustAsync`, `ExclusiveBetween`, `GreaterThan`, `LessThan`, rules with `When`/`Unless`, rule sets) are checked on the server only. Their messages appear under the fields after the post.
- When `GreaterThanOrEqualTo` and `LessThanOrEqualTo` are combined, the browser shows one range message.
- `Matches` passes when the pattern is found anywhere in the value, in the browser too. Patterns the browser can't run the same way are checked on the server only: patterns with `RegexOptions` (e.g. `IgnoreCase`), .NET-only syntax (e.g. `(?i)`, `\A`, `\p{L}`), `\w`, `\d` or `\b` (they match letters like "ç" and other Unicode digits in .NET, but only ASCII in JavaScript, also with `RegexOptions.ECMAScript`), and patterns from the model. Use explicit ranges (e.g. `[0-9]`, `[a-zA-Z]`) to validate them in the browser too.

Turn off the client-side rules with `AddFormHelperFluentValidation(o => o.ClientSideValidation = false)`.

If your project still uses FluentValidation.AspNetCore's auto validation, FormHelper.FluentValidation doesn't validate a second time. The same applies to its client-side adapters.

## Custom server-side validation

Implement `IFormModelValidator` to run your own (async) validation for every `[FormValidator]` action and page, before the model state is checked:

```csharp
public class TitleValidator : IFormModelValidator
{
    public async Task ValidateAsync(FormModelValidationContext context)
    {
        if (context.Model is ProductViewModel product && await IsReservedAsync(product.Title))
        {
            // GetKey adds the binding prefix, e.g. "Input.Title" on a Razor Page
            context.ModelState.AddModelError(context.GetKey("Title"), "This title is reserved.");
        }
    }
}

builder.Services.AddSingleton<IFormModelValidator, TitleValidator>();
```

## JavaScript API

`window.FormHelper`:

| Member | Description |
|---|---|
| `FormHelper.submit(form)` | Validates and submits the form. Returns a Promise. |
| `FormHelper.validate(form)` | Validates the form. Returns a Promise of `true`/`false`. |
| `FormHelper.reset(form)` | Resets the values and clears the validation messages. |
| `FormHelper.fill(form, data, callbacks)` | Fills the fields from an object. `callbacks: { fieldName: (value) => {...} }` handles a field yourself. |
| `FormHelper.showErrors(form, errors)` | Shows errors: `[{ propertyName, messages }]` or `{ Title: "message" }`. |
| `FormHelper.validation.addRule(name, fn)` | Adds a rule to the built-in validator. |
| `FormHelper.configure(options)` | Changes the defaults (see below). |
| `FormHelper.version` | The script version. |

`form` can be a form element, a selector (`"#productForm"`), a jQuery object or an element inside the form.

### beforeSubmit and callback

```js
// asp-beforeSubmit="beforeProductSave"
async function beforeProductSave(form, request) {
    // request: { url, method, headers, body }, you can change it
    request.headers["X-Tenant"] = "42";

    return confirm("Save the product?"); // false cancels
}

// asp-callback="productSaved"
function productSaved(result, form) {
    // result: { status, isSucceed, message, redirectUri, redirectDelay, object, validationErrors }
}
```

### Events

The form raises DOM events, an alternative to `asp-callback` and `asp-beforeSubmit`:

| Event | `event.detail` | |
|---|---|---|
| `formhelper:before-submit` | `{ form, request }` | Before the request. `event.preventDefault()` cancels it. |
| `formhelper:invalid` | `{ form }` | Client-side validation failed. |
| `formhelper:success` | `{ form, result, response }` | A successful result. |
| `formhelper:error` | `{ form, result, response }` | An error result, or a response that isn't a FormResult (`result` is `null`). |
| `formhelper:complete` | `{ form, result, response }` | After success or error. |

```js
document.getElementById("productForm").addEventListener("formhelper:success", (e) => {
    console.log(e.detail.result.object);
});
```

The events bubble, so you can also listen on `document`.

### Defaults

```js
FormHelper.configure({
    notify: false, // no notifications; or a function ({ type, message, form }) => {...}
    toastr: { closeButton: true, progressBar: true } // default fhToastr options
});
```

The options written by the tag helper (data type, redirect delay, position, validation, messages...) take precedence over `configure()`. Set them on the server with `AddFormHelper(options => ...)` or the form's attributes.

## Notifications (fhToastr)

Form Helper's notifications are also available to your own code:

```js
fhToastr.success("Product saved.");
fhToastr.info("Nothing changed.");
fhToastr.warning("The stock is low.", "Warning");
fhToastr.error("The product could not be saved.", null, { timeOut: 0, closeButton: true });

fhToastr.clear();  // hides the notifications with an animation
fhToastr.remove(); // removes them immediately
```

Messages are shown as text. To show HTML you trust (never user input), pass `{ escapeHtml: false }`.

Options (per call, or globally with `fhToastr.options` / `FormHelper.configure({ toastr })`): `timeOut` (5000, 0 keeps it open), `extendedTimeOut`, `closeButton`, `progressBar`, `positionClass`, `preventDuplicates`, `newestOnTop`, `tapToDismiss`, `escapeHtml`, `rtl`, `onclick`, `onShown`, `onHidden`.

On screens narrower than 768px, notifications use the full width.

## Localization

Set `LocalizationResourceType` to localize `CheckTheFormFieldsMessage`, `InvalidRequestMessage` and `ErrorMessage` with `IStringLocalizer`. The option values are used as resource keys:

```csharp
builder.Services.AddLocalization(o => o.ResourcesPath = "Resources");
builder.Services.AddControllersWithViews().AddFormHelper(o => o.LocalizationResourceType = typeof(SharedResource));
```

Validation messages come from your model (DataAnnotations or Fluent Validation) and are localized there.

## Security

- `[FormValidator]` validates the antiforgery token by default. The form tag helper adds the token to forms with `method="post"`.
- Messages from the server (FormResult messages, validation errors and `[Remote]` responses) are shown as text, never as HTML.
- When the token is invalid (e.g. the page was open for too long), the user sees `InvalidRequestMessage` with a 400 status code. This also works when the token is checked before `[FormValidator]` runs (Razor Pages, `[AutoValidateAntiforgeryToken]`).

## Building and testing

The client script is written in plain JavaScript in `client/src` and built with esbuild into `src/FormHelper/Scripts` and `src/FormHelper/Styles`. The built files are committed, so building the .NET projects doesn't need Node.js.

```
cd client
npm install
npm run build   # builds the scripts and styles
npm run check   # fails if the built files are out of date
npm test        # runs the sample and tests it in headless Chrome (needs Chrome and the .NET SDK)
```

.NET tests:

```
dotnet test tests/FormHelper.Tests
dotnet test tests/FormHelper.FluentValidation.Tests
```

The sample in `sample/FormHelper.Samples` shows every feature: tag helper, html helper, without jQuery, Razor Pages, normal posts and a form loaded into a modal.

## License

[MIT](https://github.com/sinanbozkus/FormHelper/blob/master/License.txt)
