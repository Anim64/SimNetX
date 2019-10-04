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
                return BinarySearch(this.network[vertice1], vertice2);
            }

        }



        public void AddDirectedEdge(string vertice1, string vertice2)
        {
            if (!this.network.ContainsKey(vertice1))
                this.network[vertice1] = new List<string>();

            
            
        }

        public void AddIndirectedEdge(string vertice1, string vertice2)
        {
            if (!this.network.ContainsKey(vertice1))
                this.network[vertice1] = new List<string>();

            if (!this.network.ContainsKey(vertice2))
                this.network[vertice2] = new List<string>();

            this.network[vertice1].Add(vertice2);
            this.network[vertice2].Add(vertice1);
        }

        private void AddWithOrder(string vertice1, string vertice2)
        {
            int numberOfEdges = this.network[vertice1].Count;
            int insertIndex = numberOfEdges - 1;
            for (int i = 0; i < numberOfEdges; i++)
            {
                
                if (string.Compare(vertice2, this.network[vertice1][i]) < 0)
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

                    
                }
            }
        }
    }
}
