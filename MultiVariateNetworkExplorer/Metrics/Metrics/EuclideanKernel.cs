using Columns.Types;
using DataFrameLibrary;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Metrics.Metrics
{
    public class EuclideanKernel : IMetric
    {
        protected override Matrix<double> CalculateMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            int dataCount = vectorData.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            for (int i = 0; i < dataCount; i++)
            {
                for (int j = i; j < dataCount; j++)
                {
                    if (i == j)
                    {
                        kernelMatrix[i, j] = kernelMatrix[j, i] = 1;
                        continue;

                    }

                    double euclideanDistance = 0;
                    var columnNames = vectorData.Columns;
                    if (exclude != null)
                    {
                        columnNames = columnNames.Except(exclude);
                    }

                    foreach (var columnName in columnNames)
                    {
                        var column = vectorData[columnName];
                        if (!(column is ColumnString))
                        {
                            double vectorValueA = column.Data[i] != null ? Convert.ToDouble(column.Data[i]) : vectorData.Averages[columnName];
                            double vectorValueB = column.Data[j] != null ? Convert.ToDouble(column.Data[j]) : vectorData.Averages[columnName];
                            euclideanDistance += Math.Pow((vectorValueA - vectorValueB), 2);
                        }

                    }

                    kernelMatrix[i, j] = kernelMatrix[j, i] = 1 / Math.Sqrt(euclideanDistance);
                }
            }

            return kernelMatrix;
        }
    }
}
