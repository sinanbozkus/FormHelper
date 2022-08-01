using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace FormHelper.Samples.Enums
{
    [DefaultValue(User)]
    public enum UserType
    {
        [Display(Name = "Admin")]
        Admin = 1,

        [Display(Name = "Moderator")]
        Moderator = 2,

        [Display(Name = "Operator")]
        Operator = 3,

        [Display(Name = "User")]
        User = 4,
    }
}
