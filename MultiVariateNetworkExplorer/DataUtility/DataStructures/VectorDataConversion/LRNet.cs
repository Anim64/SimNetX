using DataUtility.DataStructures.Metrics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DataUtility.DataStructures.VectorDataConversion
{
    public class LRNet : IVectorConversion
    {
        
        public Network ConvertToNetwork(DataFrame vectorData, IMetric metric, IEnumerable<string> exclude = null)
        {
            ColumnString idColumn = vectorData.IdColumn;
            Network resultNet = new Network(idColumn);
            Matrix<double> kernelMatrix = metric.GetMetricMatrix(vectorData);
            Dictionary<int, int> degrees = new Dictionary<int, int>();
            Dictionary<int, int> significances = new Dictionary<int, int>();

            Dictionary<int, double> representativeness = new Dictionary<int, double>();
            

            for (int i = 0; i < kernelMatrix.Rows; i++)
            {
                int nearestNeighbour = -1;
                double maxSimilarity = -1;
                for (int j = 0; j < kernelMatrix.Cols; j++)
                {
                    if (i == j)
                    {
                        continue;
                    }

                    if (!degrees.ContainsKey(i))
                    {
                        degrees[i] = 0;
                        significances[i] = 0;
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

                    //if (kernelMatrix[i, j] > maxSimilarity)
                    //{
                    //    maxSimilarity = kernelMatrix[i, j];
                    //    nearestNeighbour = j;
                    //}
                }

                if (!significances.ContainsKey(nearestNeighbour))
                {
                    significances[nearestNeighbour] = 0;
                }

                significances[nearestNeighbour]++;


            };

            for (int i = 0; i < kernelMatrix.Rows; i++)
            {
                //if (significances[i] > 0)
                //{
                //    representativeness[i] = 1.0 / (Math.Pow((1 + degrees[i]), (1.0 / significances[i])));
                //}

                //else
                //{
                //    representativeness[i] = 0;
                //}

                representativeness[i] = significances[i] > 0 ? 1.0 / (Math.Pow((1 + degrees[i]), (1.0 / significances[i]))) : 0;

                int k = ((int)Math.Round(representativeness[i] * degrees[i]));

                double[] vertexSimilarities = kernelMatrix.GetRow(i);
                List<int> potentialNeighbours = Enumerable.Range(0, vectorData.DataCount).ToList();
                potentialNeighbours = potentialNeighbours.OrderByDescending(kv => vertexSimilarities[kv]).ToList();

                int finalNumberOfNeighbors = k > 0 ? k + 1 : 2;
                
                for (int n = 0; n < finalNumberOfNeighbors; n++)
                {
                    if (i != potentialNeighbours[n])
                    {
                        resultNet.SetIndirectedEdge(idColumn[i].ToString(), idColumn[potentialNeighbours[n]].ToString(), 1);

                    }
                }
                

               
            };
            return resultNet;
        }
    }
}
