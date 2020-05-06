using DataUtility;

namespace MultiVariateNetworkExplorer2.Models
{
    public class GraphModel
    {
        public MultiVariateNetwork Mvn { get; set; }
        public string Graph { get; set; }

        public string Store { get; set; }
        public string Selection { get; set; }
        public string Filter { get; set; }
    }
}
