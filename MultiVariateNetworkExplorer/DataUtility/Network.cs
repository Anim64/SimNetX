using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace DataUtility
{
    public class Network
    {
        SortedDictionary<string, List<string>> network;

        public Network()
        {
            network = new SortedDictionary<string, List<string>>();
            
        }

        public bool this[string vertice1, string vertice2]
        {
            get
            {   
                return Utils.BinarySearch<string>(this.network[vertice1], vertice2);
            }

        }



        public void AddDirectedEdge(string vertice1, string vertice2)
        {
            if (!this.network.ContainsKey(vertice1))
                this.network[vertice1] = new List<string>();

            if (!this.network.ContainsKey(vertice2))
                this.network[vertice2] = new List<string>();

            AddWithOrder(vertice1, vertice2);


        }

        public void AddIndirectedEdge(string vertice1, string vertice2)
        {
            if (!this.network.ContainsKey(vertice1))
                this.network[vertice1] = new List<string>();

            if (!this.network.ContainsKey(vertice2))
                this.network[vertice2] = new List<string>();

            AddWithOrder(vertice1, vertice2);
            AddWithOrder(vertice2, vertice1);
        }

        private void AddWithOrder(string vertice1, string vertice2)
        {
            int numberOfEdges = this.network[vertice1].Count;
            int insertIndex = numberOfEdges - 1;
            for (int i = 0; i < numberOfEdges - 1; i++)
            {
                
                if (vertice2.CompareTo(this.network[vertice1][i]) < 0)
                {
                    insertIndex = i;
                    break;
                }
                
            }

            this.network[vertice1].Insert(insertIndex, vertice2);
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
                        this.network[splitLine[0]] = new List<string>();

                    if (!this.network.ContainsKey(splitLine[1]))
                        this.network[splitLine[1]] = new List<string>();

                    if(directed)
                    {
                        AddWithOrder(splitLine[0], splitLine[1]);
                    }

                    else
                    {
                        AddWithOrder(splitLine[0], splitLine[1]);
                        AddWithOrder(splitLine[1], splitLine[0]);
                    }


                }
            }
        }
    }
}
