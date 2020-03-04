using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace DataUtility
{
    public class Network : IEnumerable<KeyValuePair<string, Dictionary<string, double>>>
    {
        /*public struct Edge
        {
            public int ToNode;
            public double Weight;

            /// <summary>
            /// Constructs a weighted edge between two nodes.
            /// </summary>
            /// <param name="n1">The first node.</param>
            /// <param name="n2">The second node.</param>
            /// <param name="w">The edge's weight.</param>
            public Edge(int n1, int n2, double w)
            {
                ToNode = n2;
                Weight = w;
            }
        }*/
        private Dictionary<string, Dictionary<string, double>> network;
        public double CurrSize { get; private set; }

        public Network(int initSize)
        {
            network = new Dictionary<string, Dictionary<string, double>>();
            for (int i = 0; i < initSize; i++)
            {
                network[i.ToString()] = new Dictionary<string, double>();
            }
        }

        public Dictionary<string, double> this[string vertex]
        {
            get
            {
                return this.network[vertex];
            }
        }


        public bool this[string vertex1, string vertex2]
        {
            get
            {   
                return this.network[vertex1][vertex2] > 0;
            }

        }



        public void AddDirectedEdge(string vertex1, string vertex2, double weight)
        {

            this.network[vertex1][vertex2] = weight;
            CurrSize += weight;

        }

        public void AddIndirectedEdge(string vertex1, string vertex2, double weight)
        {
            this.network[vertex1][vertex2] = weight;
            this.network[vertex2][vertex1] = weight;
            CurrSize += weight;
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

                    if (!this.network.ContainsKey(splitLine[0]))
                        this.network[splitLine[0]] = new Dictionary<string, double>();

                    

                    if(directed)
                    {
                        AddDirectedEdge(splitLine[0], splitLine[1], 1);
                    }

                    else
                    {
                        if (!this.network.ContainsKey(splitLine[1]))
                            this.network[splitLine[1]] = new Dictionary<string, double>();
                        AddIndirectedEdge(splitLine[0], splitLine[1], 1);
                    }


                }
            }
        }

        public int GetDegree(string vertex)
        {
            return this.network[vertex].Keys.Count;
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
