using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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

        public IEnumerable<string> this[string vertex]
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
                return Utils.BinarySearch<string>(this.network[vertex1], vertex2);
            }

        }



        public void AddDirectedEdge(string vertex1, string vertex2)
        {

            if(!this.network.TryGetValue(vertex1, out SortedSet<string> links_v1))
            {
                if (links_v1 == null)
                {
                    this.network[vertex1] = links_v1;
                    links_v1 = new SortedSet<string>();
                }
                
            }

            if (!this.network.TryGetValue(vertex2, out SortedSet<string> links_v2))
            {
                if (links_v2 == null)
                {
                    this.network[vertex1] = links_v2;
                    links_v2 = new SortedSet<string>();
                }


            }

            this.network[vertex1].Add(vertex2);




        }

        public void AddIndirectedEdge(string vertex1, string vertex2)
        {
            if (!this.network.TryGetValue(vertex1, out SortedSet<string> links_v1))
            {
                if (links_v1 == null)
                {
                    this.network[vertex1] = new SortedSet<string>();
                    
                }

                
            }

            if (!this.network.TryGetValue(vertex2, out SortedSet<string> links_v2))
            {
                if (links_v2 == null)
                {
                    this.network[vertex2] = new SortedSet<string>();
                }


            }

            this.network[vertex1].Add(vertex2);
            this.network[vertex2].Add(vertex1);
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
