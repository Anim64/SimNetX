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
                            euclideanDistance += pair.Value.Data[i] != null && pair.Value.Data[j] != null ? Math.Pow((double)(Convert.ToDouble(pair.Value.Data[i]) - Convert.ToDouble(pair.Value.Data[j])), 2) : 0;
                        }

                    }

                    kernelMatrix[i, j] = kernelMatrix[j, i] = Math.Sqrt(euclideanDistance);
                }
            }

            return kernelMatrix;
        }
    }
}
