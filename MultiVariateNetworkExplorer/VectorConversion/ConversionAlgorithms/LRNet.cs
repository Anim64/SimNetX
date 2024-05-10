using Columns.Types;
using DataFrameLibrary;
using Metrics;
using NetworkLibrary;
using System;
using System.Collections.Generic;
using System.Linq;

namespace VectorConversion.VectorDataConversion
{
    public class LRNet : IVectorConversion
    {
        private double Reduction { get; }

        private double K { get; }


        public LRNet(double reduction, double k)
        {
            this.Reduction = reduction;
            this.K = k;
        }

        public Network ConvertToNetwork(DataFrame vectorData, IMetric metric, bool doNulify = false, IEnumerable<string> exclude = null)
        {
            ColumnString idColumn = vectorData.IdColumn;
            Network resultNet = new(idColumn);
            Matrix<double> kernelMatrix = metric.GetMetricMatrix(vectorData, doNulify, exclude);
            Dictionary<int, int> degrees = new();
            Dictionary<int, int> significances = new();

            Dictionary<int, double> representativeness = new Dictionary<int, double>();
            

            for (int i = 0; i < kernelMatrix.Rows; i++)
            {
                int nearestNeighbour = -1;
                double maxSimilarity = -1;

                if (!degrees.ContainsKey(i))
                {
                    degrees[i] = 0;
                    significances[i] = 0;
                }

                for (int j = 0 ; j < kernelMatrix.Cols; j++)
                {
                    if (i == j)
                    {
                        continue;
                    }

                    if (kernelMatrix[i, j] > 0)
                    {

                        degrees[i]++;

                        if (kernelMatrix[i, j] > maxSimilarity)
                        {
                            maxSimilarity = kernelMatrix[i, j];
                            nearestNeighbour = j;
                        }
                    }
                }

                if (!significances.ContainsKey(nearestNeighbour))
                {
                    significances[nearestNeighbour] = 0;
                }

                significances[nearestNeighbour]++;


            };

            for (int i = 0; i < kernelMatrix.Rows; i++)
            {

                representativeness[i] = significances[i] > 0 ? 1.0 / (Math.Pow((1 + degrees[i]), (1.0 / significances[i]))) : 0;

                double[] vertexSimilarities = kernelMatrix.GetRow(i);
                List<int> potentialNeighbours = Enumerable.Range(0, vectorData.DataCount).ToList();
                potentialNeighbours = potentialNeighbours.OrderByDescending(kv => vertexSimilarities[kv]).ToList();

                int k = (int)Math.Round(representativeness[i] * this.Reduction * degrees[i]);
                k = k > this.K ? k + 1 : (int)this.K;
                
                int finalNumberOfNeighbors = Math.Min(k, potentialNeighbours.Count - 1);
                
                for (int n = 1; n < finalNumberOfNeighbors; n++)
                {
                    resultNet.SetIndirectedEdge(idColumn[i].ToString(), idColumn[potentialNeighbours[n]].ToString(), 1);
                }

                double lastNeighbourSimilarityValue = vertexSimilarities[potentialNeighbours[finalNumberOfNeighbors - 1]];
                if (lastNeighbourSimilarityValue > 0)
                {
                    int n = finalNumberOfNeighbors;
                    while (n < potentialNeighbours.Count && vertexSimilarities[potentialNeighbours[n]] == lastNeighbourSimilarityValue)
                    {
                        resultNet.SetIndirectedEdge(idColumn[i].ToString(), idColumn[potentialNeighbours[n]].ToString(), 1);
                        n++;
                    }
                }

            };

            return resultNet;
        }
    }
}
