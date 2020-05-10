using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataUtility
{
    public class Network : IEnumerable<KeyValuePair<string, ConcurrentDictionary<string, double>>>
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
        public ConcurrentDictionary<string, ConcurrentDictionary<string, double>> Data { get; set; }
        public double CurrSize { get; set; }
        public int NumberOfEdges { get;  set; }
        public int NumberOfVertices { get; set; }

        public Network()
        {
            Data = new ConcurrentDictionary<string, ConcurrentDictionary<string, double>>();
        }
        public Network(int initSize)
        {
            Data = new ConcurrentDictionary<string, ConcurrentDictionary<string, double>>();
            for (int i = 0; i < initSize; i++)
            {
                Data[i.ToString()] = new ConcurrentDictionary<string, double>();
            }
            this.NumberOfVertices = initSize;
        }

        public Network(JObject json) 
        {
            this.Data = new ConcurrentDictionary<string, ConcurrentDictionary<string, double>>();
            this.NumberOfVertices = json["nodes"].Count();
            this.NumberOfEdges = 0;
            this.CurrSize = 0;
            foreach(var node in json["nodes"])
            {
                this.Data[(string)node["id"]] = new ConcurrentDictionary<string, double>();
            }
            foreach(var link in json["links"])
            {
                this.SetDirectedEdge((string)link["source"]["id"], (string)link["target"]["id"], (double)link["value"]);
                CurrSize += (double)link["value"];
                NumberOfEdges++; 
            }

            CurrSize = CurrSize / 2;
            NumberOfEdges = NumberOfEdges / 2;

        }

        public Network(Network net)
        {
            Data = new ConcurrentDictionary<string, ConcurrentDictionary<string, double>>();
            this.NumberOfEdges = net.NumberOfEdges;
            this.CurrSize = net.CurrSize;
            this.NumberOfVertices = net.NumberOfVertices;
            foreach(var pair in net.Data)
            {
                this.Data[pair.Key] = new ConcurrentDictionary<string, double>(pair.Value);
            }

        }

        public ConcurrentDictionary<string, double> this[string vertex]
        {
            get
            {
                return this.Data[vertex];
            }
        }


        public double this[string vertex1, string vertex2]
        {
            get
            {   
                return this.Data[vertex1][vertex2];
            }

        }

        public IEnumerable<string> Nodes { get { return Data.Keys; } }

        /// <summary>
        /// An iterator for the edges in the graph.
        /// </summary>
        public IEnumerable<Edge> Edges
        {
            get
            {
                foreach (var entry1 in Data)
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

        public int Count
        {
            get
            {
                return this.NumberOfVertices;
            }
        }

        public bool IsReadOnly 
        { 
            get 
            {
                return false;
            } 
        }

        public ConcurrentDictionary<string, double> EnsureIncidenceList(string node)
        {
            ConcurrentDictionary<string, double> outdict;
            if(!this.Data.TryGetValue(node, out outdict))
            {
                outdict = this.Data[node] = new ConcurrentDictionary<string, double>();
            }
            return outdict;
        }
        public void AddNode(string node)
        {
            ConcurrentDictionary<string, double> edges;
            if(!this.Data.TryGetValue(node, out edges))
            {
                this.Data[node] = new ConcurrentDictionary<string, double>();
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



        public void ReadFromFile(string filename, bool header = false, bool directed = false, params char[] separator)
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
            this.Data[vertex].TryGetValue(vertex, out double loop);
            return this.Data[vertex].Values.Sum() + loop;
        }

        public double EdgeWeight(string node1, string node2, double defaultValue)
        {
            ConcurrentDictionary<string, double> ilist;
            if (!Data.TryGetValue(node1, out ilist))
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

        public IEnumerator<KeyValuePair<string, ConcurrentDictionary<string, double>>> GetEnumerator()
        {
            foreach(KeyValuePair<string, ConcurrentDictionary<string, double>> pair in this.Data)
            {
                yield return pair;
            }
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }
        /*
        public void Add(KeyValuePair<string, Dictionary<string, double>> item)
        {
            this.Data.Add(item.Key, item.Value);
        }

        public void Clear()
        {
            this.Data.Clear();
        }

        public bool Contains(KeyValuePair<string, Dictionary<string, double>> item)
        {
            return this.Data.Contains(item);
        }

        public void CopyTo(KeyValuePair<string, Dictionary<string, double>>[] array, int arrayIndex)
        {
            throw new NotImplementedException();
        }

        public bool Remove(KeyValuePair<string, Dictionary<string, double>> item)
        {
            return this.Data.Remove(item.Key);
        }
        */
    }
}
