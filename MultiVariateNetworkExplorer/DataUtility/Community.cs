using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DataUtility
{
    public static class Community
    {
        private static int PASS_MAX = -1;
        private static double MIN = 0.0000001;

        /// <summary>
        /// Compute the modularity of a partition of a graph.
        /// 
        /// Raises:
        /// KeyNotFoundException if the partition does not partition all graph nodes
        /// InvalidOperationException if the graph has no link
        /// 
        /// References:
        /// 1. Newman, M.E.J. & Girvan, M. Finding and evaluating community structure in networks. Physical Review E 69, 26113(2004).
        /// </summary>
        /// <param name="graph">The graph which is decomposed.</param>
        /// <param name="partition">The partition of the nodes in the graph (i.e., a dictionary where keys are nodes and values are communities).</param>
        /// <returns>The modularity.</returns>
        public static double Modularity(Network graph, Dictionary<string, int> partition)
        {
            Dictionary<int, double> inc = new Dictionary<int, double>();
            Dictionary<int, double> deg = new Dictionary<int, double>();

            double links = graph.CurrSize;
            if (links == 0)
            {
                throw new InvalidOperationException("A graph without links has undefined modularity.");
            }

            foreach (var node in graph)
            {
                int com = partition[node.Key];
                deg[com] = DictGet(deg, com, 0) + graph.GetDegree(node.Key);
                foreach (var edge in node.Value)
                {
                    string neighbor = edge.Key;
                    if (partition[neighbor] == com)
                    {
                        double weight;
                        if (neighbor == node.Key)
                        {
                            weight = edge.Value;
                        }
                        else
                        {
                            weight = edge.Value / 2;
                        }
                        inc[com] = DictGet(inc, com, 0) + weight;
                    }
                }
            }

            double res = 0;
            foreach (int component in partition.Values.Distinct())
            {
                res += DictGet(inc, component, 0) / links - Math.Pow(DictGet(deg, component, 0) / (2 * links), 2);
            }
            return res;
        }
        public static Dictionary<int, int> BestPartition(Network graph, Dictionary<int, int> partition)
        {
            Dendrogram dendro = GenerateDendrogram(graph, partition);
            return dendro.PartitionAtLevel(dendro.Length - 1);
        }

        public static Dictionary<int, int> BestPartition(Network graph)
        {
            return BestPartition(graph, null);
        }

        private static Dictionary<A, int> Renumber<A>(Dictionary<A, int> dict)
        {
            var ret = new Dictionary<A, int>();
            var new_values = new Dictionary<int, int>();

            foreach (A key in dict.Keys.OrderBy(a => a))
            {
                int value = dict[key];
                int new_value;
                if (!new_values.TryGetValue(value, out new_value))
                {
                    new_value = new_values[value] = new_values.Count;
                }
                ret[key] = new_value;
            }
            return ret;
        }

        private static B DictGet<A, B>(Dictionary<A, B> dict, A key, B defaultValue)
        {
            B result;
            if (dict.TryGetValue(key, out result))
            {
                return result;
            }
            else
            {
                return defaultValue;
            }
        }

        /// <summary>
        /// To handle several pieces of data for the algorithm in one structure.
        /// </summary>
        private class Status
        {
            public Dictionary<string, int> Node2Com;
            public Double TotalWeight;
            public Dictionary<int, double> Degrees;
            public Dictionary<string, double> GDegrees;
            public Dictionary<string, double> Loops;
            public Dictionary<int, double> Internals;

            public Status()
            {
                Node2Com = new Dictionary<string, int>();
                TotalWeight = 0;
                Degrees = new Dictionary<int, double>();
                GDegrees = new Dictionary<string, double>();
                Loops = new Dictionary<string, double>();
                Internals = new Dictionary<int, double>();
            }

            public Status(Network graph, Dictionary<string, int> part)
                : this()
            {

                int count = 0;
                this.TotalWeight = graph.CurrSize;
                if (part == null)
                {
                    foreach (var node in graph)
                    {
                        Node2Com[node.Key] = count;
                        double deg = graph.GetDegree(node.Key);
                        if (deg < 0)
                        {
                            throw new ArgumentException("Graph has negative weights.");
                        }
                        Degrees[count] = GDegrees[node.Key] = deg;
                        Internals[count] = Loops[node.Key] = graph.EdgeWeight(node.Key, node.Key, 0);
                        count += 1;
                    }
                }
                else
                {
                    foreach (var node in graph)
                    {
                        int com = part[node.Key];
                        Node2Com[node.Key] = com;
                        double deg = graph.GetDegree(node.Key);
                        Degrees[com] = DictGet(Degrees, com, 0) + deg;
                        GDegrees[node.Key] = deg;
                        double inc = 0;
                        foreach (var edge in graph[node.Key])
                        {
                            string neighbor = edge.Key;
                            if (edge.Value <= 0)
                            {
                                throw new ArgumentException("Graph must have postive weights.");
                            }
                            if (part[neighbor] == com)
                            {
                                if (neighbor == node.Key)
                                {
                                    inc += edge.Value;
                                }
                                else
                                {
                                    inc += edge.Value / 2;
                                }
                            }
                        }
                        Internals[com] = DictGet(Internals, com, 0) + inc;
                    }
                }
            }
        }
}
