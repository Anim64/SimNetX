using DataFrameLibrary;
using System;
using System.Collections.Generic;

namespace Metrics
{
    public abstract class IMetric
    {
        protected abstract Matrix<double> CalculateMetricMatrix(DataFrame vectorData, IEnumerable<string> exclude = null);
        private Matrix<double> NulifyMatrix(Matrix<double> matrix)
        {
            double geometricMean = 0;
            for(int i = 0; i < matrix.Rows; i++)
            {
                for(int j = i + 1; j < matrix.Cols; j++)
                {
                    double value = matrix[i, j];

                    if (value > 0)
                    {
                        geometricMean += Math.Log(matrix[i, j]);
                    }
                }
            }

            double similarityCount = (matrix.Rows * matrix.Cols - matrix.Rows) / 2.0;
            geometricMean /= similarityCount;
            geometricMean = Math.Exp(geometricMean);

            for (int i = 0; i < matrix.Rows; i++)
            {
                for (int j = i + 1; j < matrix.Cols; j++)
                {
                    if (matrix[i, j] < geometricMean)
                    {
                        matrix[i, j] = matrix[j, i] = 0;
                    }
                }
            }

            return matrix;
        }

        public Matrix<double> GetMetricMatrix(DataFrame vectorData, bool doNulify, IEnumerable<string> exclude = null)
        {
            Matrix<double> similarityMatrix = CalculateMetricMatrix(vectorData, exclude);
            if(doNulify)
            {
                similarityMatrix = NulifyMatrix(similarityMatrix);
            }

            return similarityMatrix;
        }
    }
}
