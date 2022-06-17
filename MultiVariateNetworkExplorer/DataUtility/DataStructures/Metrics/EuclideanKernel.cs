using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DataUtility.DataStructures.Metrics
{
    public class EuclideanKernel : IMetric
    {
        public Matrix<double> GetMetricMatrix(DataFrame vectorData)
        {
            int dataCount = vectorData.First().Value.Data.Count;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            for (int i = 0; i < dataCount; i++)
            {
                for (int j = i + 1; j < dataCount; j++)
                {
                    double euclideanDistance = 0;
                    foreach (var pair in vectorData)
                    {

                        if (!(pair.Value is ColumnString))
                        {
                            double vectorValueA = pair.Value.Data[i] != null ? Convert.ToDouble(pair.Value.Data[i]) : 0;
                            double vectorValueB = pair.Value.Data[j] != null ? Convert.ToDouble(pair.Value.Data[j]) : 0;
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
