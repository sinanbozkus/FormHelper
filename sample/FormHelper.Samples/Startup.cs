﻿using Microsoft.AspNetCore.Builder;
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
            // Add FormHelper to the project.
            services.AddFormHelper(new FormHelperConfiguration
            {
                RedirectDelay = 30
            });

            // Add FormHelper to the project with configurations.
            //services.AddFormHelper(new FormHelperConfiguration
            //{
            //    CheckTheFormFieldsMessage = "Form alanlarını kontrol ediniz."
            //});

            // You can add these validators in a separate class.
            services.AddTransient<IValidator<ProductFormViewModel>, ProductFormViewModelValidator>();

            services.AddControllersWithViews()
                    .AddFluentValidation();
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
