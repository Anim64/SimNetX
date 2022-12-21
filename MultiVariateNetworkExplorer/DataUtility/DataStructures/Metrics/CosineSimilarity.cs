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
            Dictionary<int, double> magnitudes = new Dictionary<int, double>();
            for (int i = 0; i < dataCount; i++)
            {
                magnitudes[i] = -1;
            }
            

            Parallel.For(0, dataCount, i =>
            {
                bool isVectorMagnitudeANotCalc = magnitudes[i] == -1;
                double vectorMagnitudeA = isVectorMagnitudeANotCalc ? 0 : magnitudes[i];
                for (int j = i; j < dataCount; j++)
                {
                    if (i == j)
                    {
                        kernelMatrix[i, j] = kernelMatrix[j, i] = 1;
                        continue;

                    }

                    bool isVectorMagnitudeBNotCalc = magnitudes[j] == -1;
                    double vectorMagnitudeB = isVectorMagnitudeBNotCalc ? 0 : magnitudes[j];
                    double dotProduct = 0;

                    foreach (var pair in vectorData)
                    {

                        if (!(pair.Value is ColumnString))
                        {
                            double vectorValueA = pair.Value.Data[i] != null ? Convert.ToDouble(pair.Value.Data[i]) : vectorData.Averages[pair.Key];
                            double vectorValueB = pair.Value.Data[j] != null ? Convert.ToDouble(pair.Value.Data[j]) : vectorData.Averages[pair.Key];

                            if (isVectorMagnitudeANotCalc)
                            {
                                vectorMagnitudeA += Math.Pow(vectorValueA, 2);

                            }

                            if(isVectorMagnitudeBNotCalc)
                            {
                                vectorMagnitudeB += Math.Pow(vectorValueB, 2);
                            }
                                    
                            dotProduct += vectorValueA * vectorValueB;
                        }

                    }

                    if (isVectorMagnitudeANotCalc)
                    {
                        vectorMagnitudeA = Math.Sqrt(vectorMagnitudeA);
                        magnitudes[i] = vectorMagnitudeA;
                    }
                    if (isVectorMagnitudeBNotCalc)
                    {
                        vectorMagnitudeB = Math.Sqrt(vectorMagnitudeB);
                        magnitudes[j] = vectorMagnitudeB;
                    }

                    kernelMatrix[i, j] = kernelMatrix[j, i] = dotProduct / (vectorMagnitudeA * vectorMagnitudeB);
                    
                }
            });

            return kernelMatrix;
        }
    }
}
