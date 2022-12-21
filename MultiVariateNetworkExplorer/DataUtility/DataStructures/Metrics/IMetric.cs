using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility.DataStructures.Metrics
{
    public interface IMetric
    {
        Matrix<double> GetMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null);
    }
}
