
using Metrics;
using Metrics.Metrics;
using MultiVariateNetworkLibrary;
using VectorConversion;
using VectorConversion.VectorDataConversion;

namespace MultiVariateNetworkExplorer2.Models
{
    public class GraphModel
    {
        public MultiVariateNetwork Mvn { get; set; }
        public string Graph { get; set; }
        public string Selection { get; set; }
        public IMetric Metric { get; }
        public object[] MetricParams { get; }
        public IVectorConversion ConversionAlg { get; }
        public object[] ConversionParams { get; }


        public GraphModel()
        {
            Mvn = new MultiVariateNetwork();
            Graph = MultiVariateNetwork.EmptyD3Json().ToString();
            Selection = Mvn.PartitionsToD3Json();
            Metric = new GaussKernel();
            MetricParams = null;
            ConversionAlg = new LRNet(1, 1);

        }

        public GraphModel(MultiVariateNetwork mvn)
        {
            Mvn = mvn;
            Graph = Mvn.ToD3Json().ToString();
            Selection = Mvn.PartitionsToD3Json();
        }

        public GraphModel(MultiVariateNetwork mvn, ErrorInputModel eim)
        {
            Mvn = mvn;
            Graph = Mvn.ToD3Json().ToString();
            Selection = Mvn.PartitionsToD3Json();
        }
    }
}
