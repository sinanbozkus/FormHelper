using System.ComponentModel.DataAnnotations;

namespace FormHelper.Samples.Enums
{
    public enum Category
    {
        [Display(Name = "Laptops")]
        Laptop = 1,

        [Display(Name = "Phones")]
        Phone = 2,

        [Display(Name = "Televisions")]
        Television = 3,

        [Display(Name = "Sports and Outdoors")]
        SportsOutdoor = 4,
    }
}
