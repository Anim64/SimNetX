using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataUtility.DataStructures.Metrics
{
    public class CosineSimilarity : IMetric
    {
        public Matrix<double> GetMetricMatrix(DataFrame vectorData)
        {
            int dataCount = vectorData.First().Value.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            Parallel.For(0, dataCount, i =>
            {
                for (int j = i; j < dataCount; j++)
                {
                    if (i == j)
                    {
                        kernelMatrix[i, j] = kernelMatrix[j, i] = 1;

                    }
                    else
                    {
                        double vectorMagnitudeA = 0;
                        double vectorMagnitudeB = 0;
                        double dotProduct = 0;
                        foreach (var pair in vectorData)
                        {

                            if (!(pair.Value is ColumnString))
                            {
                                double vectorValueA = pair.Value.Data[i] != null ? Convert.ToDouble(pair.Value.Data[i]) : 0;
                                double vectorValueB = pair.Value.Data[j] != null ? Convert.ToDouble(pair.Value.Data[j]) : 0;

                                vectorMagnitudeA += Math.Pow(vectorValueA, 2);
                                vectorMagnitudeB += Math.Pow(vectorValueB, 2);
                                dotProduct += vectorValueA * vectorValueB;
                            }

                        }

                        vectorMagnitudeA = Math.Sqrt(vectorMagnitudeA);
                        vectorMagnitudeB = Math.Sqrt(vectorMagnitudeB);
                        kernelMatrix[i, j] = kernelMatrix[j, i] = dotProduct / (vectorMagnitudeA * vectorMagnitudeB);
                    }
                }
            });

            return kernelMatrix;
        }
    }
}
