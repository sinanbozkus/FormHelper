using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;

namespace FormHelper.FluentValidation.ClientSide
{
    /// <summary>
    /// Adds a client validator for each model property. The validator itself finds the property's rules
    /// (the IValidator is resolved per request, so it holds no state and can be reused).
    /// </summary>
    internal sealed class FluentValidationClientModelValidatorProvider : IClientModelValidatorProvider
    {
        public void CreateValidators(ClientValidatorProviderContext context)
        {
            var metadata = context.ModelMetadata;

            if (metadata.MetadataKind != ModelMetadataKind.Property || metadata.ContainerType == null || metadata.PropertyName == null)
            {
                return;
            }

            context.Results.Add(new ClientValidatorItem
            {
                Validator = new FluentValidationClientModelValidator(metadata.ContainerType, metadata.PropertyName),
                IsReusable = true
            });
        }
    }
}
