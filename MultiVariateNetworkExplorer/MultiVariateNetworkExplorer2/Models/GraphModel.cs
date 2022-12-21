using DataUtility;
using DataUtility.DataStructures;

namespace MultiVariateNetworkExplorer2.Models
{
    public class GraphModel
    {
        public MultiVariateNetwork Mvn { get; set; }
        public string Graph { get; set; }
        public string Selection { get; set; }

        public ErrorInputModel Error { get; set; }

        public GraphModel()
        {
            Mvn = new MultiVariateNetwork();
            Graph = Mvn.EmptyD3Json().ToString();
            Selection = Mvn.PartitionsToD3Json();
            Error = null;
        }

        public GraphModel(MultiVariateNetwork mvn)
        {
            Mvn = mvn;
            Graph = Mvn.ToD3Json().ToString();
            Selection = Mvn.PartitionsToD3Json();
            Error = null;
        }

        public GraphModel(MultiVariateNetwork mvn, ErrorInputModel eim)
        {
            Mvn = mvn;
            Graph = Mvn.ToD3Json().ToString();
            Selection = Mvn.PartitionsToD3Json();
            Error = eim;
        }
    }
}
