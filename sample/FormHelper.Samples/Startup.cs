using FormHelper.Samples.Models;
using FormHelper;
using FormHelper.Samples.Validators;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Serialization;
using FluentValidation;
using FluentValidation.AspNetCore;

namespace FormHelper.Samples
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add FormHelper to the project.
            services.AddFormHelper();

            // Add FormHelper to the project with configurations.
            //services.AddFormHelper(new FormHelperConfiguration
            //{
            //    CheckTheFormFieldsMessage = "Form alanlarını kontrol ediniz."
            //});

            // You can add these validators in a separate class.
            services.AddTransient<IValidator<ProductFormViewModel>, ProductFormViewModelValidator>();

            services.AddMvc()
                .AddFluentValidation()
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseDeveloperExceptionPage();
            app.UseStaticFiles();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
