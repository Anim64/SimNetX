using Columns.Types;
using DataFrameLibrary;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Metrics.Metrics
{
    public class GaussKernel : IMetric
    {
        public double Sigma { get; set; }
        public GaussKernel(double sigma = 1)
        {
            this.Sigma = sigma;
        }
        protected override Matrix<double> CalculateMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            int dataCount = vectorData.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            //for(int i = 0; i < dataCount; i++)
            Parallel.For(0, dataCount, i =>
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

                    double gauss1 = 1.0 / (this.Sigma * Math.Sqrt(2 * Math.PI));
                    double gauss2 = (-euclideanDistance) / (2 * Math.Pow(this.Sigma, 2));
                    double gauss3 = Math.Pow(Math.E, (gauss2));
                    double gauss4 = gauss1 * gauss3;
                    kernelMatrix[i, j] = kernelMatrix[j, i] = gauss4;

                }
            });

            return kernelMatrix;
        }

        
    }
}
