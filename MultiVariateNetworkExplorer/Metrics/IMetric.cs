using DataFrameLibrary;
using System.Collections.Generic;

namespace Metrics
{
    public interface IMetric
    {
        Matrix<double> GetMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null);
    }
}
