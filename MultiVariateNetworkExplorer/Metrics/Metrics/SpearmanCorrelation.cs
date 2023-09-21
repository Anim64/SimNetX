using Columns.Types;
using DataFrameLibrary;
using System.Collections.Generic;
using System.Linq;

namespace Metrics.Metrics
{
    public class SpearmanCorrelation : IMetric
    {
        public Matrix<double> GetMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null)
        {
            DataFrame orderDataFrame = GetValueOrderDataFrame(vectorData, exclude);
            PearsonCorrelation pc = new PearsonCorrelation();
            return pc.GetMetricMatrix(orderDataFrame);
        }

        private DataFrame GetValueOrderDataFrame(DataFrame vectorData, IEnumerable<string> exclude)
        {
            DataFrame result = new DataFrame()
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

            //Parallel.For(0, vectorData.DataCount, i =>
            for (int i = 0; i < vectorData.DataCount; i++)
            {
                RankifyVector(vectorData, columnNames, i, result);
            }//);

            return result;
        }

        private void RankifyVector(DataFrame vectorData, IEnumerable<string> columns, int vectorIndex, DataFrame output)
        {
            int columnCount = columns.Count();
            for (int i = 0; i < columnCount; i++)
            {

                int r = 1, s = 1;

                int j = 0;
                double iValue = (double)vectorData[columns.ElementAt(i)][vectorIndex];
                while(j < i)
                {
                    double jValue = (double)vectorData[columns.ElementAt(j)][vectorIndex];
                    if (jValue < iValue)
                    {
                        r++;
                        j++;
                        continue;
                    }

                    if(jValue == iValue)
                    {
                        s++;
                    }

                    j++;
                }

                j = i + 1;

                while(j < columnCount) 
                {
                    double jValue = (double)vectorData[columns.ElementAt(j)][vectorIndex];
                    if (jValue < iValue)
                    {
                        r++;
                        j++;
                        continue;
                    }

                    if (jValue == iValue)
                    {
                        s++;
                    }

                    j++;
                }

                double rank = (r + (s - 1) * 0.5);
                output[columns.ElementAt(i)].AddData(rank);
            }
        }
    }
}
