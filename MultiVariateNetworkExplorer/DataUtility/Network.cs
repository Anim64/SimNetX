using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;

namespace DataUtility
{
    public class Network : IEnumerable<KeyValuePair<string, Dictionary<string, double>>>
    {
        public struct Edge
        {
            public string FromNode;
            public string ToNode;
            public double Weight;

            /// <summary>
            /// Constructs a weighted edge between two nodes.
            /// </summary>
            /// <param name="n1">The first node.</param>
            /// <param name="n2">The second node.</param>
            /// <param name="w">The edge's weight.</param>
            public Edge(string n1, string n2, double w)
            {
                FromNode = n1;
                ToNode = n2;
                Weight = w;
            }
        }
        private Dictionary<string, Dictionary<string, double>> network;
        public double CurrSize { get; private set; }
        public int NumberOfEdges { get; private set; }
        public int NumberOfVertices { get; private set; }

        public Network()
        {
            network = new Dictionary<string, Dictionary<string, double>>();
        }
        public Network(int initSize)
        {
            network = new Dictionary<string, Dictionary<string, double>>();
            for (int i = 0; i < initSize; i++)
            {
                network[i.ToString()] = new Dictionary<string, double>();
            }
            this.NumberOfVertices = initSize;
        }

        public Network(Network net)
        {
            network = new Dictionary<string, Dictionary<string, double>>();
            this.NumberOfEdges = net.NumberOfEdges;
            this.CurrSize = net.CurrSize;
            this.NumberOfVertices = net.NumberOfVertices;
            foreach(var pair in net.network)
            {
                this.network[pair.Key] = new Dictionary<string, double>(pair.Value);
            }

        }

        public Dictionary<string, double> this[string vertex]
        {
            get
            {
                return this.network[vertex];
            }
        }


        public double this[string vertex1, string vertex2]
        {
            get
            {   
                return this.network[vertex1][vertex2];
            }

        }

        public IEnumerable<string> Nodes { get { return network.Keys; } }

        /// <summary>
        /// An iterator for the edges in the graph.
        /// </summary>
        public IEnumerable<Edge> Edges
        {
            get
            {
                foreach (var entry1 in network)
                {
                    foreach (var entry2 in entry1.Value)
                    {
                        if (double.Parse(entry1.Key, CultureInfo.InvariantCulture) <= double.Parse(entry2.Key, CultureInfo.InvariantCulture))
                        {
                            // don't double-count non-self-loops
                            yield return new Edge(entry1.Key, entry2.Key, entry2.Value);
                        }
                    }
                }
            }
        }
        public Dictionary<string, double> EnsureIncidenceList(string node)
        {   
            Dictionary<string, double> outdict;
            if(!this.network.TryGetValue(node, out outdict))
            {
                outdict = this.network[node] = new Dictionary<string, double>();
            }
            return outdict;
        }
        public void AddNode(string node)
        {
            Dictionary<string, double> edges;
            if(!this.network.TryGetValue(node, out edges))
            {
                this.network[node] = new Dictionary<string, double>();
            }
        }

        public void AddDirectedEdge(string vertex1, string vertex2, double weight)
        {
            var outdict = EnsureIncidenceList(vertex1);
            outdict.TryGetValue(vertex2, out double oldWeight);
            outdict[vertex2] = oldWeight + weight;
            

        }

        public void AddIndirectedEdge(string vertex1, string vertex2, double weight)
        {
            AddDirectedEdge(vertex1, vertex2, weight);
            if(vertex1 != vertex2)
            {
                AddDirectedEdge(vertex2, vertex1, weight);
            }
            CurrSize += weight;
            NumberOfEdges++;
        }

        public void SetDirectedEdge(string vertex1, string vertex2, double weight)
        {
            var outdict = EnsureIncidenceList(vertex1);
            outdict[vertex2] = weight;
        }

        public void SetIndirectedEdge(string vertex1, string vertex2, double weight)
        {
            SetDirectedEdge(vertex1, vertex2, weight);
            if (vertex1 != vertex2)
            {
                SetDirectedEdge(vertex2, vertex1, weight);
            }
            CurrSize += weight;
            NumberOfEdges++;
        }



        public void ReadFromFile(string filename, char separator, bool header = false, bool directed = false)
        {
            using(StreamReader sr = new StreamReader(filename))
            {
                string line;
                if(header)
                {
                    line = sr.ReadLine();
                }

                while((line = sr.ReadLine()) != null)
                {
                    line = line.Trim();
                    if(line == "")
                    {
                        continue;
                    }

                    string[] splitLine = line.Split(separator);

                    if (directed)
                    {
                        AddDirectedEdge(splitLine[0], splitLine[1], 1);
                    }

                    else
                    {
                        
                        AddIndirectedEdge(splitLine[0], splitLine[1], 1);
                    }


                }
            }
        }

        public double GetDegree(string vertex)
        {
            this.network[vertex].TryGetValue(vertex, out double loop);
            return this.network[vertex].Values.Sum() + loop;
        }

        public double EdgeWeight(string node1, string node2, double defaultValue)
        {
            Dictionary<string, double> ilist;
            if (!network.TryGetValue(node1, out ilist))
            {
                throw new IndexOutOfRangeException("No such node " + node1);
            }
            double value;
            if (!ilist.TryGetValue(node2, out value))
            {
                return defaultValue;
            }
            else
            {
                return value;
            }
        }

        public Network Quotient(Dictionary<string, string> partition)
        {
            Network ret = new Network();
            foreach (string com in partition.Values)
            {
                ret.AddNode(com);
            }
            foreach (var edge in this.Edges)
            {
                
                ret.AddIndirectedEdge(partition[edge.FromNode], partition[edge.ToNode], edge.Weight);

                
            }
            return ret;
        }

        public IEnumerator<KeyValuePair<string, Dictionary<string, double>>> GetEnumerator()
        {
            foreach(KeyValuePair<string, Dictionary<string, double>> pair in this.network)
            {
                yield return pair;
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
    }
}
