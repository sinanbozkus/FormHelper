using FluentValidation;
using FormHelper;
using FormHelper.Samples.Validators;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

builder.Services.AddControllersWithViews()
    // Enum names (e.g. radio values) in Json requests
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    .AddFormHelper(options =>
    {
        // Bootstrap marks invalid inputs with "is-invalid". For Tailwind, e.g. "border-red-500".
        options.InputErrorCssClass = "is-invalid";

        // Other options:
        // options.CheckTheFormFieldsMessage = "Form alanlarını kontrol ediniz.";
        // options.RedirectDelay = 2000;
        // options.ToastrDefaultPosition = ToastrPosition.TopFullWidth;
        // options.ClientValidation = ClientValidation.BuiltIn;
    });

// Fluent Validation (FormHelper.FluentValidation package): validates the models of [FormValidator] actions
// and Razor Pages (async rules work too) and adds client-side validation attributes.
builder.Services.AddValidatorsFromAssemblyContaining<ProductFormViewModelValidator>();
builder.Services.AddFormHelperFluentValidation();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}

app.UseStaticFiles();

// Serves formhelper.js / formhelper.css under /formhelper/
app.UseFormHelper();

app.UseRouting();

app.MapRazorPages();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
