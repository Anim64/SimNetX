using Columns.Types;
using DataFrameLibrary;
using Matrix;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Metrics.Metrics
{
    public class GowerSimilarity : IMetric
    {
        protected override Matrix<double> CalculateMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            int dataCount = vectorData.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);
            if(vectorData.NumAtrrExtremes.Count == 0)
            {
                vectorData.FindAttributeExtremesAndValues();
            }

            Dictionary<string, double> numericalRanges = vectorData.NumAtrrExtremes.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Max - kvp.Value.Min);


            Parallel.For(0, dataCount, i =>
            {
                for (int j = i; j < dataCount; j++)
                {
                    if (i == j)
                    {
                        kernelMatrix[i, j] = kernelMatrix[j, i] = 1;
                        continue;
                    }

                    var columnNames = vectorData.Columns;
                    if (exclude != null)
                    {
                        columnNames = columnNames.Except(exclude);
                    }
                    double distance = 0;
                    uint validFeatureCount = 0;
                    foreach (var columnName in columnNames)
                    {
                        var column = vectorData[columnName];
                        if (column.Data[i] is null || column.Data[j] is null)
                        {
                            continue;
                        }
                        if (column is ColumnDouble)
                        {

                            double vectorValueA = Convert.ToDouble(column.Data[i]);
                            double vectorValueB = Convert.ToDouble(column.Data[j]);

                            distance += Math.Abs(vectorValueA - vectorValueB) / (numericalRanges[columnName]);
                            
                            continue;
                        }

                        if(column is ColumnString)
                        {
                            string vectorValueA = column.Data[i].ToString();
                            string vectorValueB = column.Data[j].ToString();
                            distance += vectorValueA == vectorValueB ? 0 : 1;
                        }

                        validFeatureCount++;

                    }


                    kernelMatrix[i, j] = kernelMatrix[j, i] = 1 - (distance / validFeatureCount);

                }
            });

            return kernelMatrix;
        }
    }
}
