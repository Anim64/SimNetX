using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataUtility.DataStructures.Metrics
{
    public class CosineSimilarity : IMetric
    {
        public Matrix<double> GetMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            int dataCount = vectorData.DataCount;
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


                    var columnNames = vectorData.Columns;
                    if(exclude != null)
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
