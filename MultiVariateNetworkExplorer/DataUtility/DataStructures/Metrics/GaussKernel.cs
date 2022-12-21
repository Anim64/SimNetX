using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataUtility.DataStructures.Metrics
{
    public class GaussKernel : IMetric
    {
        public double Sigma { get; set; }
        public GaussKernel(double sigma = 1)
        {
            this.Sigma = sigma;
        }
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
                        double euclideanDistance = 0;
                        foreach (var pair in vectorData)
                        {

                            if (!(pair.Value is ColumnString))
                            {
                                double vectorValueA = pair.Value.Data[i] != null ? Convert.ToDouble(pair.Value.Data[i]) : vectorData.Averages[pair.Key];
                                double vectorValueB = pair.Value.Data[j] != null ? Convert.ToDouble(pair.Value.Data[j]) : vectorData.Averages[pair.Key];
                                euclideanDistance += Math.Pow((vectorValueA - vectorValueB), 2);
                            }

                        }
                        
                        double gauss1 = 1.0 / (this.Sigma * Math.Sqrt(2 * Math.PI));
                        double gauss2 = (-euclideanDistance) / (2 * Math.Pow(this.Sigma, 2));
                        double gauss3 = Math.Pow(Math.E, (gauss2));
                        double gauss4 = gauss1 * gauss3;
                        kernelMatrix[i, j] = kernelMatrix[j, i] = gauss4;
                    }
                }
            });

            return kernelMatrix;
        }

        
    }
}
