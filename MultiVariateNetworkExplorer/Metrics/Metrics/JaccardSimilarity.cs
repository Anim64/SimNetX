using Columns.Types;
using DataFrameLibrary;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Metrics.Metrics
{
    public class JaccardSimilarity : IMetric
    {
        public Matrix<double> GetMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            int dataCount = vectorData.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);
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


                    double andCount = 0;
                    double orCount = 0;
                    foreach (var columnName in columnNames)
                    {
                        var column = vectorData[columnName];
                        if (column is not ColumnString)
                        {
                            
                            double vectorValueA = column.Data[i] != null ? Convert.ToDouble(column.Data[i]) : 0;
                            double vectorValueB = column.Data[j] != null ? Convert.ToDouble(column.Data[j]) : 0;
                            if (vectorValueA.IsNotBinary() || vectorValueB.IsNotBinary())
                            {
                                throw new InvalidOperationException("Numerical columns in your data are not binary. " +
                                    "Please check your data and try again");
                            }

                            if (vectorValueA <= 0 && vectorValueB <= 0)
                            {
                                continue;
                            }

                            orCount++;

                            if(vectorValueA >= 1 && vectorValueB >= 1)
                            {
                                andCount++;
                            }
                        }
                    }

                    double jaccard = andCount / orCount;
                    kernelMatrix[i, j] = kernelMatrix[j, i] = jaccard;
                }
            });

            return kernelMatrix;
        }

        
    }
}
