namespace MultiVariateNetworkExplorer2.Models
{
    public class ErrorInputModel
    {
        public string ErrorMessage { get; set; } = string.Empty;
        public string Separators { get; set; } = string.Empty;
        public string MissingValues { get; set; } = string.Empty;

        public string IdColumn { get; set; } = string.Empty;
        public string GroupColumn { get; set; } = string.Empty;

    }
}
