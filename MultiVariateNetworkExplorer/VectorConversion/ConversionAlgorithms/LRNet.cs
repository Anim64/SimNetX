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
            Dictionary<int, uint> localDegrees = new();
            Dictionary<int, uint> localSignificances = new();


            FillDegreeAndSignificance(resultNet, localDegrees, localSignificances);
            CalculateDegreeAndSignificance(resultNet, kernelMatrix, localDegrees, localSignificances);
            Dictionary<int, double> xRepreBases = CalculateXRepresentativenessBase(localDegrees, localSignificances);
            Dictionary<int, double> localRepresentativeness = CalculateLocalRepresentativeness(xRepreBases);
            Dictionary<int, uint> ks = CalculateRepresentativeNeighbourK(localDegrees, localRepresentativeness);

            foreach (var k in ks)
            {
                int objectI = k.Key;
                List<int> neighbours = new();
                for (int j = 0; j < resultNet.Count; j++)
                {
                    if (kernelMatrix[objectI, j] > 0 && objectI != j)
                    {
                        neighbours.Add(j);
                    }
                }
                neighbours = neighbours
                    .OrderByDescending(j => kernelMatrix[objectI, j])
                    .ToList();

                int finalK = Math.Min((int)Math.Max(k.Value, this.K), neighbours.Count);

                //Max similarity is 1, so 2 will always be higher
                double lastSimilarity = 2;
                string iNodeId = idColumn[objectI];
                int count = 0;
                int n = 0;
                while(count < finalK && n < neighbours.Count) 
                {
                    int neighbourId = neighbours[n];
                    string jNodeId = idColumn[neighbourId];
                    resultNet.SetIndirectedEdge(iNodeId, jNodeId, 1);

                    if (kernelMatrix[objectI, neighbourId] < lastSimilarity)
                    {
                        count++;
                    }

                    n++;
                }
                
            }
            return resultNet;
        }

        private void FillDegreeAndSignificance(Network resultNet, 
            Dictionary<int, uint> localDegrees, Dictionary<int, uint> localSignificances)
        {
            for (int i = 0; i < resultNet.Count; i++)
            { 
                localDegrees[i] = 0;
                localSignificances[i] = 0;
            }
        }

        private void CalculateDegreeAndSignificance(Network resultNet, Matrix<double> kernelMatrix, 
            Dictionary<int, uint> localDegrees, Dictionary<int, uint> localSignificances)
        {
            for (int i = 0; i < resultNet.Count; i++)
            { 
                List<int> nearestNeighbours = null;
                double nearestNeighboursSimilarity = 0;

                for (int j = 0; j < resultNet.Count; j++)
                {
                    double similarity = kernelMatrix[i, j];
                    if (similarity > 0 && i != j)
                    {
                        localDegrees[i]++;
                        if (similarity > nearestNeighboursSimilarity)
                        {
                            nearestNeighbours = new List<int> { j };
                            nearestNeighboursSimilarity = similarity;
                            continue;
                        }
                        if (similarity == nearestNeighboursSimilarity)
                        {
                            nearestNeighbours.Add(j);
                        }
                    }
                }

                if(nearestNeighbours != null)
                {
                    foreach (int neighbour in nearestNeighbours)
                    {
                        localSignificances[neighbour]++;
                    }
                }
                
            }
        }

        private Dictionary<int, double> CalculateXRepresentativenessBase(Dictionary<int, uint> localDegrees, 
            Dictionary<int, uint> localSignificances)
        {
            Dictionary<int, double> xRepreBases = new();
            foreach (int index in localDegrees.Keys)
            {
                xRepreBases[index] = -1;
                if (localSignificances[index] > 0)
                {
                    xRepreBases[index] = Math.Pow(1 + localDegrees[index], (1.0 / localSignificances[index] ));
                }
            }

            return xRepreBases;
        }

        private Dictionary<int, double> CalculateLocalRepresentativeness(Dictionary<int, double> xRepreBases)
        {
            Dictionary<int, double> localRepresentativeness = new();

            foreach (int index in xRepreBases.Keys)
            {
                double xRepreBase = xRepreBases[index];
                localRepresentativeness[index] = xRepreBase > 0 ? 1.0 / xRepreBase : 0;
            }

            return localRepresentativeness;
        }

        private Dictionary<int, uint> CalculateRepresentativeNeighbourK(Dictionary<int, uint> localDegrees, 
            Dictionary<int, double> localRepresentativeness)
        {
            Dictionary<int, uint> k = new();

            foreach(int index in localDegrees.Keys)
            {
                k[index] = (uint)Math.Round(localRepresentativeness[index] * localDegrees[index] * this.Reduction);
            }

            return k;
        }
    }
}
