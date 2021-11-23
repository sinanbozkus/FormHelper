using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FluentValidation;
using FluentValidation.AspNetCore;
using FormHelper.Samples.Models;
using FormHelper.Samples.Validators;

namespace FormHelper.Samples
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews()
                    .AddFormHelper(fh => { fh.ToastrDefaultPosition = ToastrPosition.BottomRight; })
                    .AddFluentValidation();

            // You can add these validators in a separate class.
            services.AddTransient<IValidator<ProductFormViewModel>, ProductFormViewModelValidator>();

            // Add FormHelper to the project with configurations.
            // services.AddControllersWithViews()
            //         .AddFormHelper(options => 
            //         {
            //             options.CheckTheFormFieldsMessage = "Form alanlarını kontrol ediniz.";
            //             options.EmbeddedFiles = true;
            //             options.RedirectDelay = 2000;
            //             options.ToastrDefaultPosition = ToastrPosition.TopFullWidth;
            //         })
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            }

            app.UseStaticFiles();

            app.UseRouting();

            app.UseFormHelper();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
