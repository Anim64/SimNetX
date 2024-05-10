using Columns.Types;
using DataFrameLibrary;
using Metrics;
using NetworkLibrary;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;

namespace VectorConversion.VectorDataConversion
{
    public class EpsilonKNN : IVectorConversion
    {
        public double Radius { get; set; }
        public double K { get; set; }

        public EpsilonKNN(double radius, double k)
        {
            this.Radius = radius;
            this.K = k;
        }

        
       
        public Network ConvertToNetwork(DataFrame vectorData, IMetric metric, bool doNulify = false, IEnumerable<string> exclude = null)
        {
            ColumnString idColumn = vectorData.IdColumn;
            Network result = new(idColumn);
            Matrix<double> kernelMatrix = metric.GetMetricMatrix(vectorData, doNulify, exclude);


            for (int i = 0; i < kernelMatrix.Rows; i++)
            {
                Dictionary<int, double> dict = new();

                for (int j = i; j < kernelMatrix.Cols; j++)
                {
                    if (i != j)
                    {
                        dict[j] = kernelMatrix[i, j];
                    }

                }

                var orderedDict = dict.OrderByDescending(key => key.Value);

                int edgeCount = 0;

                foreach (KeyValuePair<int, double> pair in orderedDict)
                {
                    if (edgeCount >= this.K && pair.Value < this.Radius)
                        break;

                    result.SetIndirectedEdge(idColumn[i].ToString(), idColumn[pair.Key].ToString(), 1);
                    edgeCount++;
                }
            }

            return result;
        }
    }
}
