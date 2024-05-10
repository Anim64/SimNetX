using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using NetworkLibrary;

namespace CommunityDetection
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
        public static double Modularity(Network graph, Dictionary<string, string> partition)
        {
            Dictionary<string, double> inc = new Dictionary<string, double>();
            Dictionary<string, double> deg = new Dictionary<string, double>();

            double links = graph.TotalWeight;
            if (links == 0)
            {
                throw new InvalidOperationException("A graph without links has undefined modularity.");
            }

            foreach (var node in graph)
            {
                string com = partition[node.Key];
                deg[com] = DictGet(deg, com, 0) + graph.GetDegree(node.Key);
                foreach (var edge in graph[node.Key])
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
            foreach (string component in partition.Values.Distinct())
            {
                res += DictGet(inc, component, 0) / links - Math.Pow(DictGet(deg, component, 0) / (2 * links), 2);
            }
            return res;
        }
        public static Dictionary<string, string> BestPartition(Network graph, Dictionary<string, string> partition)
        {
            Dendrogram dendro = GenerateDendrogram(graph, partition);
            return dendro.PartitionAtLevel(dendro.Length - 1);
        }

        public static Dictionary<string, string> BestPartition(Network graph)
        {
            return BestPartition(graph, null);
        }

        public static Dendrogram GenerateDendrogram(Network graph, Dictionary<string, string> part_init)
        {
            Dictionary<string, string> partition;
            Stopwatch stopwatch = new Stopwatch();
            stopwatch.Restart();

            // Special case, when there is no link, the best partition is everyone in its own community.
            if (graph.NumberOfEdges == 0)
            {
                partition = new Dictionary<string, string>();
                int i = 0;
                foreach (var node in graph.Nodes)
                {
                    partition[node] = i++.ToString();
                }
                return new Dendrogram(partition);
            }

            Network current_graph = new Network(graph);
            Status status = new Status(current_graph, part_init);
            double mod = status.Modularity();
            List<Dictionary<string, string>> status_list = new List<Dictionary<string, string>>();
            status.OneLevel(current_graph);
            double new_mod;
            new_mod = status.Modularity();

            int iterations = 1;
            do
            {
                iterations++;
                partition = Renumber(status.Node2Com);
                status_list.Add(partition);
                mod = new_mod;
                current_graph = current_graph.Quotient(partition);
                status = new Status(current_graph, null);
                status.OneLevel(current_graph);
                new_mod = status.Modularity();
            } while (new_mod - mod >= MIN);
            //Console.Out.WriteLine("(GenerateDendrogram: {0} iterations in {1})", iterations, stopwatch.Elapsed);

            return new Dendrogram(status_list);
        }

        private static Dictionary<A, string> Renumber<A>(Dictionary<A, string> dict)
        {
            var ret = new Dictionary<A, string>();
            var new_values = new Dictionary<string, string>();

            foreach (A key in dict.Keys.OrderBy(a => a/*int.Parse(a.ToString(), CultureInfo.InvariantCulture)*/))
            {
                string value = dict[key];
                if (!new_values.TryGetValue(value, out string new_value))
                {
                    new_value = new_values[value] = new_values.Count.ToString();
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
            public Dictionary<string, string> Node2Com;
            public double TotalWeight;
            public Dictionary<string, double> Degrees;
            public Dictionary<string, double> GDegrees;
            public Dictionary<string, double> Loops;
            public Dictionary<string, double> Internals;

            public Status()
            {
                Node2Com = new Dictionary<string, string>();
                TotalWeight = 0;
                Degrees = new Dictionary<string, double>();
                GDegrees = new Dictionary<string, double>();
                Loops = new Dictionary<string, double>();
                Internals = new Dictionary<string, double>();
            }

            public Status(Network graph, Dictionary<string, string> part)
                : this()
            {

                int count = 0;
                TotalWeight = graph.TotalWeight;
                if (part == null)
                {
                    foreach (var node in graph.Nodes)
                    {
                        Node2Com[node] = count.ToString();
                        double deg = graph.GetDegree(node);
                        if (deg < 0)
                        {
                            throw new ArgumentException("Graph has negative weights.");
                        }
                        Degrees[count.ToString()] = GDegrees[node] = deg;
                        Internals[count.ToString()] = Loops[node] = graph.EdgeWeight(node, node, 0);
                        count += 1;
                    }
                }
                else
                {
                    foreach (var node in graph.Nodes)
                    {
                        string com = part[node];
                        Node2Com[node] = com;
                        double deg = graph.GetDegree(node);
                        Degrees[com] = DictGet(Degrees, com, 0) + deg;
                        GDegrees[node] = deg;
                        double inc = 0;
                        foreach (var edge in graph[node])
                        {
                            string neighbor = edge.Key;
                            if (edge.Value <= 0)
                            {
                                throw new ArgumentException("Graph must have positive weights.");
                            }
                            if (part[neighbor] == com)
                            {
                                if (neighbor == node)
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

            /// <summary>
            /// Compute the modularity of the partition of the graph fast using precomputed status.
            /// </summary>
            /// <returns></returns>
            public double Modularity()
            {
                double links = TotalWeight;
                double result = 0;
                foreach (string community in Node2Com.Values.Distinct())
                {
                    double in_degree = DictGet(Internals, community, 0);
                    double degree = DictGet(Degrees, community, 0);
                    if (links > 0)
                    {
                        result += in_degree / links - Math.Pow(degree / (2 * links), 2);
                    }
                }
                return result;
            }

            /// <summary>
            /// Used in parallelized OneLevel
            /// </summary>
            private Tuple<double, string> EvaluateIncrease(string com, double dnc, double degc_totw)
            {
                double incr = dnc - DictGet(Degrees, com, 0) * degc_totw;
                return Tuple.Create(incr, com);
            }

            /// <summary>
            /// Compute one level of communities.
            /// </summary>
            /// <param name="graph">The graph to use.</param>
            public void OneLevel(Network graph)
            {
                bool modif = true;
                int nb_pass_done = 0;
                double cur_mod = Modularity();
                double new_mod = cur_mod;

                while (modif && nb_pass_done != PASS_MAX)
                {
                    cur_mod = new_mod;
                    modif = false;
                    nb_pass_done += 1;

                    foreach (var node in graph.Nodes)
                    {
                        string com_node = Node2Com[node];
                        double degc_totw = DictGet(GDegrees, node, 0) / (TotalWeight * 2);
                        Dictionary<string, double> neigh_communities = NeighCom(node, graph);
                        Remove(node, com_node, DictGet(neigh_communities, com_node, 0));

                        Tuple<double, string> best;
                        best = (from entry in neigh_communities.AsParallel()
                                select EvaluateIncrease(entry.Key, entry.Value, degc_totw))
                               .Concat(new[] { Tuple.Create(0.0, com_node) }.AsParallel())
                               .Max();
                        string best_com = best.Item2;
                        Insert(node, best_com, DictGet(neigh_communities, best_com, 0));
                        if (best_com != com_node)
                        {
                            modif = true;
                        }
                    }
                    new_mod = Modularity();
                    if (new_mod - cur_mod < MIN)
                    {
                        break;
                    }
                }
            }

            /// <summary>
            /// Compute the communities in th eneighborhood of the node in the given graph.
            /// </summary>
            /// <param name="node"></param>
            /// <param name="graph"></param>
            /// <returns></returns>
            private Dictionary<string, double> NeighCom(string node, Network graph)
            {
                Dictionary<string, double> weights = new Dictionary<string, double>();
                foreach (var edge in graph[node])
                {
                    if (edge.Key != node)
                    {
                        string neighborcom = Node2Com[edge.Key];
                        weights[neighborcom] = DictGet(weights, neighborcom, 0) + edge.Value;
                    }
                }
                return weights;
            }

            /// <summary>
            /// Remove node from community com and modify status.
            /// </summary>
            /// <param name="node"></param>
            /// <param name="com"></param>
            /// <param name="weight"></param>
            private void Remove(string node, string com, double weight)
            {
                Degrees[com] = DictGet(Degrees, com, 0) - DictGet(GDegrees, node, 0);
                Internals[com] = DictGet(Internals, com, 0) - weight - DictGet(Loops, node, 0);
                Node2Com[node] = (-1).ToString();
            }

            /// <summary>
            /// Insert node into community and modify status.
            /// </summary>
            /// <param name="node"></param>
            /// <param name="com"></param>
            /// <param name="weight"></param>
            private void Insert(string node, string com, double weight)
            {
                Node2Com[node] = com;
                Degrees[com] = DictGet(Degrees, com, 0) + DictGet(GDegrees, node, 0);
                Internals[com] = DictGet(Internals, com, 0) + weight + DictGet(Loops, node, 0);
            }
        }
    }
}
