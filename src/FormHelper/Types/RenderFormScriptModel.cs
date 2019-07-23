namespace FormHelper
{
    public class RenderFormScriptModel
    {
        public string FormId { get; set; }
        public FormDataType DataType { get; set; }
        public string BeforeSubmit { get; set; }
        public string Callback { get; set; }
        public bool IsMobileDevice { get; set; }
    }
}
