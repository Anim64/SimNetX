using Columns.Types;
using DataFrameLibrary;
using Matrix;
using Metrics;
using NetworkLibrary;
using System.Collections.Generic;

namespace VectorConversion
{
    public interface IVectorConversion
    {
        Network ConvertToNetwork(ColumnString idColumn, Matrix<double> similarityMatrix);
    }
}
