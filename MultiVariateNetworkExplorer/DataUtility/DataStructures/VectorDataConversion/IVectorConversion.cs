using DataUtility.DataStructures.Metrics;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility.DataStructures.VectorDataConversion
{
    public interface IVectorConversion
    {
        Network ConvertToNetwork(DataFrame vectorData, IMetric metric, IColumn idColumn);
    }
}
