using Columns.Types;
using DataFrameLibrary;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Metrics.Metrics
{
    public class PearsonCorrelation : IMetric
    {
        public Matrix<double> GetMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            int dataCount = vectorData.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);
            Dictionary<int, double> rowAverages = vectorData.RowAverages();
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

                    double numerator = 0;
                    double standardDeviationA = 0;
                    double standardDeviationB = 0;

                    foreach (var columnName in columnNames)
                    {
                        var column = vectorData[columnName];
                        if (column is not ColumnString)
                        {
                            //Get vector values
                            double vectorValueA = column.Data[i] != null ? Convert.ToDouble(column.Data[i]) : vectorData.Averages[columnName];
                            double vectorValueB = column.Data[j] != null ? Convert.ToDouble(column.Data[j]) : vectorData.Averages[columnName];

                            //Calculate difference of vector value from its average value
                            double differenceA = vectorValueA - rowAverages[i];
                            double differenceB = vectorValueB - rowAverages[j];

                            //Sum differences for numerator adn deviations
                            numerator += differenceA * differenceB;
                            standardDeviationA += differenceA * differenceA;
                            standardDeviationB += differenceB * differenceB;
                        }

                    }

                    double denominator = Math.Sqrt(standardDeviationA * standardDeviationB);
                    double correlation = Math.Abs(numerator / denominator);

                    kernelMatrix[i, j] = kernelMatrix[j, i] = correlation;

                }
            });

            return kernelMatrix;
        }
    }
}
