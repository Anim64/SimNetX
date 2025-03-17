using Columns.Types;
using DataFrameLibrary;
using Matrix;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Metrics.Metrics
{
    public class SpearmanCorrelation : IMetric
    {
        protected override Matrix<double> CalculateMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            DataFrame orderDataFrame = GetValueOrderDataFrame(vectorData, exclude);
            int dataCount = vectorData.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);
            var columnNames = orderDataFrame.Columns;
            Parallel.For(0, dataCount, i =>
            {
                for (int j = i; j < dataCount; j++)
                {
                    if (i == j)
                    {
                        kernelMatrix[i, j] = kernelMatrix[j, i] = 1;
                        continue;
                    }

                    double sumOfSquaredDiffs = 0;

                    foreach (var columnName in columnNames)
                    {
                        var column = orderDataFrame[columnName];
                        if (column is not ColumnString)
                        {
                            //Get vector values
                            double vectorValueA = orderDataFrame[columnName,i] != null ? Convert.ToDouble(orderDataFrame[columnName,i]) : orderDataFrame.Averages[columnName];
                            double vectorValueB = orderDataFrame[columnName,j] != null ? Convert.ToDouble(orderDataFrame[columnName,j]) : orderDataFrame.Averages[columnName];

                            //Calculate difference of vector values
                            double difference = vectorValueA - vectorValueB;

                            //Difference squared
                            double diffSquared = difference * difference;

                            sumOfSquaredDiffs += diffSquared;
                        }
                    }

                    double correlationPairCount = columnNames.Count();
                    double numerator = 6 * sumOfSquaredDiffs;
                    double denominator = correlationPairCount * ((correlationPairCount * correlationPairCount) - 1);
                    double spearmanCorrelation = 1 - (numerator / denominator);
                    kernelMatrix[i, j] = kernelMatrix[j, i] = spearmanCorrelation;

                }
            });

            return kernelMatrix;
        }

        private DataFrame GetValueOrderDataFrame(DataFrame vectorData, IEnumerable<string> exclude)
        {
            DataFrame result = new()
            {
                DataCount = vectorData.DataCount
            };

            var columnNames = exclude is not null ? vectorData.Columns.Except(exclude).ToArray() : vectorData.Columns;

            foreach (string columnName in columnNames)
            {
                if (vectorData[columnName] is ColumnDouble)
                {
                    result.AddColumn(columnName, typeof(ColumnDouble));
                }
            }

            columnNames = result.Columns;
            
            RankifyVector(vectorData, columnNames, result);

            return result;
        }

        private void RankifyVector(DataFrame vectorData, IEnumerable<string> columns, DataFrame output)
        {
            int columnCount = columns.Count();
            int dataCount = vectorData.DataCount;

            for(int i = 0; i < dataCount ;i++)
            {   
                List<double?> vectorValues = new List<double?>();
                foreach(string column in columns)
                {
                    vectorValues.Add((double)vectorData[column][i]);
                }

                for(int j = 0; j < columnCount; j++)
                {
                    int r = 1, s = 1;

                    for(int k = 0; k < columnCount; k++)
                    {
                        if (k != j && vectorValues[k] < vectorValues[j])
                        {
                            r += 1;
                        }
            
                        if (k != j && vectorValues[k] == vectorValues[j]) 
                        {
                            s += 1;
                        }
                    }

                    double rank = r + 0.5 * (s - 1);
                    output[columns.ElementAt(j)].AddData(rank);
                }
            }
        }
    }
}
