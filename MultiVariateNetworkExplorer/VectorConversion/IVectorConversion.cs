using DataFrameLibrary;
using Metrics;
using NetworkLibrary;
using System.Collections.Generic;

namespace VectorConversion
{
    public interface IVectorConversion
    {
        Network ConvertToNetwork(DataFrame vectorData, IMetric metric, IEnumerable<string> exclude = null);
    }
}
