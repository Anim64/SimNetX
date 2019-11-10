using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace DataUtility
{
    public class Network : IEnumerable<KeyValuePair<string, SortedSet<string>>>
    {
        private SortedDictionary<string, SortedSet<string>> network;

        public Network()
        {
            network = new SortedDictionary<string, SortedSet<string>>();
            
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

            if(!this.network.TryGetValue(vertice1, out SortedSet<string> links_v1))
            {
                if (links_v1 == null)
                {
                    this.network[vertice1] = links_v1;
                    links_v1 = new SortedSet<string>();
                }
                
            }

            if (!this.network.TryGetValue(vertice2, out SortedSet<string> links_v2))
            {
                if (links_v2 == null)
                {
                    this.network[vertice1] = links_v2;
                    links_v2 = new SortedSet<string>();
                }


            }

            this.network[vertice1].Add(vertice2);




        }

        public void AddIndirectedEdge(string vertice1, string vertice2)
        {
            if (!this.network.TryGetValue(vertice1, out SortedSet<string> links_v1))
            {
                if (links_v1 == null)
                {
                    this.network[vertice1] = new SortedSet<string>();
                    
                }

                
            }

            if (!this.network.TryGetValue(vertice2, out SortedSet<string> links_v2))
            {
                if (links_v2 == null)
                {
                    this.network[vertice2] = new SortedSet<string>();
                }


            }

            this.network[vertice1].Add(vertice2);
            this.network[vertice2].Add(vertice1);
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
                        this.network[splitLine[0]] = new SortedSet<string>();

                    if (!this.network.ContainsKey(splitLine[1]))
                        this.network[splitLine[1]] = new SortedSet<string>();

                    if(directed)
                    {
                        AddDirectedEdge(splitLine[0], splitLine[1]);
                    }

                    else
                    {
                        AddIndirectedEdge(splitLine[0], splitLine[1]);
                    }


                }
            }
        }

        public IEnumerator<KeyValuePair<string, SortedSet<string>>> GetEnumerator()
        {
            foreach(KeyValuePair<string, SortedSet<string>> pair in this.network)
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
