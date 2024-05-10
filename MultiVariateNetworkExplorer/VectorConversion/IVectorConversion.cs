using DataFrameLibrary;
using Metrics;
using NetworkLibrary;
using System.Collections.Generic;

namespace VectorConversion
{
    public interface IVectorConversion
    {
        Network ConvertToNetwork(DataFrame vectorData, IMetric metric, bool doNulify = false, IEnumerable<string> exclude = null);
    }
}
