using Columns.Types;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace NetworkLibrary
{
    public class Network : IEnumerable<KeyValuePair<string, SortedDictionary<string, double>>>
    {
        private static readonly string jsonLinkSourceName = "source";
        private static readonly string jsonLinkTargetName = "target";
        private static readonly string jsonLinkValueName = "value";
        private static readonly string jsonLinkIdName = "id";

        //******************************************
        //**********Class properties section********
        //******************************************


        /// <summary>
        /// The network matrix represented as a dictionary.
        /// </summary>
        public SortedDictionary<string, SortedDictionary<string, double>> Data { get; set; }

        /// <summary>
        /// The total weight of all edges.
        /// </summary>
        public double TotalWeight { 
            get
            {
                return this.Data.Sum(fromNode => fromNode.Value.Sum(toNode => toNode.Value)) / 2;
            }
            //private set; 
        }

        /// <summary>
        /// Return the total number of edges that exist in network.
        /// </summary>
        private int numberOfEdges = -1;
        public int NumberOfEdges
        {
            get
            {
                if (numberOfEdges < 0)
                {
                    numberOfEdges = this.Data.Sum(kv => kv.Value.Count) / 2;
                }
                return numberOfEdges;
            }
        }
            

        /// <summary>
        /// Returns the number of nodes in the network. Returns the same value as <see cref="Count"/>.
        /// </summary>
        public int NumberOfVertices { get; private set; }

        /// <summary>
        /// Returns the number of nodes in the network. Returns the same value as <see cref="NumberOfVertices"/>.
        /// </summary>
        public int Count
        {
            get
            {
                return this.NumberOfVertices;
            }
        }

        /// <summary>
        /// Returns the list of all nodes in the network.
        /// </summary>
        public IEnumerable<string> Nodes { get { return Data.Keys; } }


        /// <summary>
        /// A helper struct that represents edges.
        /// </summary>
        public struct Edge
        {
            /// <summary>
            /// The starting node of the edge.
            /// </summary>
            public string FromNode;

            /// <summary>
            /// The destination node of the edge.
            /// </summary>
            public string ToNode;

            /// <summary>
            /// The weight of the edge.
            /// </summary>
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

        /// <summary>
        /// An iterator for the edges in the graph.
        /// </summary>
        public IEnumerable<Edge> Edges
        {
            get
            {
                foreach (var fromNode in Data)
                {
                    foreach (var toNode in fromNode.Value.Where(x => x.Key.CompareTo(fromNode.Key) > 0))
                    {
                        yield return new Edge(fromNode.Key, toNode.Key, toNode.Value);
                    }
                }
            }
        }

        

        //******************************************
        //***********Constructor section************
        //******************************************

        /// <summary>
        /// Constructs an empty network.
        /// </summary>
        public Network()
        {
            Data = new SortedDictionary<string, SortedDictionary<string, double>>();
            NumberOfVertices = 0;
        }

        /// <summary>
        /// Cosntructs a network with specified number of nodes but without any edge.
        /// </summary>
        /// <param name="initSize">Initial node count</param>
        public Network(int initSize)
        {
            Data = new SortedDictionary<string, SortedDictionary<string, double>>();
            for (int i = 0; i < initSize; i++)
            {
                Data[i.ToString()] = new SortedDictionary<string, double>();
            }
            this.NumberOfVertices = initSize;
        }

        public Network(ColumnString idColumn)
        {
            Data = new SortedDictionary<string, SortedDictionary<string, double>>();
            foreach (var node in idColumn)
            {
                Data[node.ToString()] = new SortedDictionary<string, double>();
            }
            this.NumberOfVertices = idColumn.DataCount;

        }

        /// <summary>
        /// Constructs a network from an <see cref="JObject"/> class.
        /// </summary>
        /// <param name="json">A json representation of the network.</param>
        public Network(JObject json) 
        {
            this.Data = new SortedDictionary<string, SortedDictionary<string, double>>();
            this.NumberOfVertices = json["nodes"].Count();
            //this.TotalWeight = 0;
            foreach(var node in json["nodes"])
            {
                this.Data[(string)node["id"]] = new SortedDictionary<string, double>();
            }
            foreach(var link in json["links"])
            {
                this.SetIndirectedEdge((string)link["source"]["id"], (string)link["target"]["id"], (double)link["value"]);
            }
            

        }

        /// <summary>
        /// Constructs a copy of the input network.
        /// </summary>
        /// <param name="net">An input network</param>
        public Network(Network net)
        {
            Data = new SortedDictionary<string, SortedDictionary<string, double>>();
            
            //this.TotalWeight = net.TotalWeight;
            this.NumberOfVertices = net.NumberOfVertices;
            foreach(var pair in net.Data)
            {
                this.Data.Add(pair.Key, pair.Value);
            }

        }

        //******************************************
        //*************Indexer section**************
        //******************************************

        /// <summary>
        ///  
        /// </summary>
        /// <param name="node">Node index</param>
        /// <returns>A dictionary containing all neighbours with weights of the specified node. </returns>
        public SortedDictionary<string, double> this[string node]
        {
            get
            {
                return this.Data[node];
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="fromNode">A starting node</param>
        /// <param name="toNode">A destination node</param>
        /// <returns>The edge weight or a default value if the edge doesn't exist.</returns>
        public double this[string fromNode, string toNode]
        {
            get
            {
                SortedDictionary<string, double> ilist;
                if (!Data.TryGetValue(fromNode, out ilist))
                {
                    throw new IndexOutOfRangeException("No such node " + fromNode);
                }
                double value;
                if (!ilist.TryGetValue(toNode, out value))
                {
                    return 0;
                }
                else
                {
                    return value;
                }
            }

        }


        //******************************************
        //*******Network manipualtion section*******
        //******************************************

        /// <summary>
        /// A helper method that creates a node in the network if it doesn't exist.
        /// </summary>
        /// <param name="node">The node index.</param>
        /// <returns>A neighbour dictionary of the specified node.</returns>
        private SortedDictionary<string, double> EnsureIncidenceList(string node)
        {
            SortedDictionary<string, double> outdict;
            if(!this.Data.TryGetValue(node, out outdict))
            {
                outdict = this.Data[node] = new SortedDictionary<string, double>();
            }
            return outdict;
        }

        public bool IsEmpty()
        {
            return this.Data.Count == 0;
        }

        /// <summary>
        /// Adds a new node into the network.
        /// </summary>
        /// <param name="node">The node index</param>
        public void AddNode(string node)
        {
            SortedDictionary<string, double> edges;
            if(!this.Data.TryGetValue(node, out edges))
            {
                this.Data[node] = new SortedDictionary<string, double>();
            }
        }

        /// <summary>
        /// Adds a new directed edge into the network. If the edge already exists, it adds the new weight to the old one.
        /// </summary>
        /// <param name="fromNode">The starting node</param>
        /// <param name="toNode">The destination node</param>
        /// <param name="weight">The edge weight</param>
        public void AddDirectedEdge(string fromNode, string toNode, double weight)
        {
            var outdict = EnsureIncidenceList(fromNode);
            outdict.TryGetValue(toNode, out double oldWeight);
            outdict[toNode] = oldWeight + weight;
            this.numberOfEdges = -1;


        }
        /// <summary>
        /// Adds a new indirected edge into the network. If the edge already exists, it adds the new weight to the old one.
        /// </summary>
        /// <param name="fromNode">The starting node</param>
        /// <param name="toNode">The destination node</param>
        /// <param name="weight">The edge weight</param>
        public void AddIndirectedEdge(string fromNode, string toNode, double weight)
        {
            AddDirectedEdge(fromNode, toNode, weight);
            if(fromNode != toNode)
            {
                AddDirectedEdge(toNode, fromNode, weight);
            }
            //TotalWeight += weight;
            
        }

        /// <summary>
        /// Sets the weight of the directed edge.
        /// </summary>
        /// <param name="fromNode">The starting node</param>
        /// <param name="toNode">The destination node</param>
        /// <param name="weight">The edge weight</param>
        public void SetDirectedEdge(string fromNode, string toNode, double weight)
        {
            var outdict = EnsureIncidenceList(fromNode);
            outdict[toNode] = weight;
            this.numberOfEdges = -1;
        }

        /// <summary>
        /// Sets the weight of the indirected edge.
        /// </summary>
        /// <param name="fromNode">The starting node</param>
        /// <param name="toNode">The destination node</param>
        /// <param name="weight">The edge weight</param>
        public void SetIndirectedEdge(string fromNode, string toNode, double weight)
        {
            SetDirectedEdge(fromNode, toNode, weight);
            if (fromNode != toNode)
            {
                SetDirectedEdge(toNode, fromNode, weight);
            }

            //TotalWeight += weight;
        }


        
        /// <summary>
        /// Gets the edge weight.
        /// </summary>
        /// <param name="fromNode"></param>
        /// <param name="toNode"></param>
        /// <param name="defaultValue"></param>
        /// <returns>An Edge weight</returns>
        public double EdgeWeight(string fromNode, string toNode, double defaultValue)
        {
            SortedDictionary<string, double> ilist;
            if (!Data.TryGetValue(fromNode, out ilist))
            {
                throw new IndexOutOfRangeException("No such node " + fromNode);
            }
            double value;
            if (!ilist.TryGetValue(toNode, out value))
            {
                return defaultValue;
            }
            else
            {
                return value;
            }
        }


        //******************************************
        //*******Network properties section*******
        //******************************************

        /// <summary>
        /// Gets the degree of the specified node.
        /// </summary>
        /// <param name="node">A node index</param>
        /// <returns>A node degree</returns>
        public double GetDegree(string node)
        {
            this.Data[node].TryGetValue(node, out double loop);
            return this.Data[node].Values.Sum() + loop;
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

        //******************************************
        //***************Metrics********************
        //******************************************

        public int MaxDegree()
        {
            return this.Data.Max(x => x.Value.Count);
        }

        public int MinDegree()
        {
            return this.Data.Min(x => x.Value.Count);

        }

        public double AverageDegree()
        {
            return this.Data.Sum(x => x.Value.Count) / this.NumberOfVertices;
        }


        //******************************************
        //*************Miscellanious****************
        //******************************************

        /// <summary>
        /// Reads the file with the network and creates an internal network representation.
        /// </summary>
        /// <param name="filename">A file path to the network.</param>
        /// <param name="header">Specifies whether the file has a header or not.</param>
        /// <param name="directed">Specifies whether the network will be directed or not.</param>
        /// <param name="separator">Characters that separate the network data in the file</param>
        /// <returns>A new instance of <see cref="Network"/> class</returns>
        public static Network ReadFromFile(string filename, bool header = false, bool directed = false, params char[] separator)
        {
            Network newNet = new Network(0);
            using (StreamReader sr = new StreamReader(filename))
            {
                string line;
                if (header)
                {
                    line = sr.ReadLine();
                }

                while ((line = sr.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (line == "")
                    {
                        continue;
                    }

                    string[] splitLine = line.Split(separator);

                    if (directed)
                    {
                        newNet.AddDirectedEdge(splitLine[0], splitLine[1], 1);
                    }

                    else
                    {

                        newNet.AddIndirectedEdge(splitLine[0], splitLine[1], 1);
                    }


                }
            }

            return newNet;
        }

        public void ToFile(string path)
        {
            using (StreamWriter sw = new StreamWriter(path))
            {
                foreach(var node1 in this)
                {
                    foreach (var node2 in node1.Value.Where(x => String.Compare(x.Key, node1.Key) > 0))
                    {
                        string edge = node1.Key + " " + node2.Key;
                        sw.WriteLine(edge);
                    }
                }
            }
            
        }

        public JArray ToD3Json()
        {
            JArray jLinks = new JArray();
            int edgeId = -1;

            foreach (var source in this)
            {
                string sourceId = source.Key;
                var links = source.Value;

                foreach (var target in links.Where(node => string.Compare(sourceId, node.Key) < 0))
                {
                    string targetId = target.Key;
                    double weight = target.Value;
                    JObject newLink = new JObject
                    {
                        [jsonLinkSourceName] = sourceId,
                        [jsonLinkTargetName] = target.Key,
                        [jsonLinkValueName] = target.Value,
                        [jsonLinkIdName] = ++edgeId
                    };
                    jLinks.Add(newLink);
                }
            }

            return jLinks;

        }

        public static Network FromD3Json(JArray jlinks)
        {
            Network network = new Network();

            foreach (var link in jlinks)
            {
                string source = (string)link[jsonLinkSourceName];
                string target = (string)link[jsonLinkTargetName];
                double value = (double)link[jsonLinkValueName];
                network.SetIndirectedEdge(source, target, value);
            }

            return network;
        }

        /// <summary>
        /// Gets a network enumerator.
        /// </summary>
        /// <returns>A network enumerator.</returns>
        public IEnumerator<KeyValuePair<string, SortedDictionary<string, double>>> GetEnumerator()
        {
            foreach(KeyValuePair<string, SortedDictionary<string, double>> pair in this.Data)
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
