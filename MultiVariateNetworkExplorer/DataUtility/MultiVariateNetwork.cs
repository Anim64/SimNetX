using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;

namespace DataUtility
{
    public class MultiVariateNetwork
    {
        public DataFrame VectorData { get; set; }
        public Network Network { get; set; }

        public Dictionary<string, string> Partition { 
            get {
                if(Partition == null)
                {
                    FindCommunities();
                }

                return Partition;
            }
            private set { this.Partition = value; }
        }


        public MultiVariateNetwork()
        {
            VectorData = new DataFrame();
            Network = new Network(0);
        }

        public MultiVariateNetwork(string fileName, bool header = false, params char[] separator)
        {
            VectorData = new DataFrame(fileName, header, separator);

            Network = VectorData.LRNet();
        }
        public void FindCommunities()
        {
            Dictionary<string, string> partition = Community.BestPartition(g);
            var communities = new Dictionary<string, List<string>>();
            foreach (var kvp in partition)
            {
                List<string> nodeset;
                if (!communities.TryGetValue(kvp.Value, out nodeset))
                {
                    nodeset = communities[kvp.Value] = new List<string>();
                }
                nodeset.Add(kvp.Key);
            }
            this.Partition = communities;
        }

        public string ToD3Json()
        {
            int edgeId = -1;
            JObject root = new JObject();

            JArray jNodes = new JArray();
            JArray jLinks = new JArray();

            foreach(var node in Network)
            {
                JObject jNode = new JObject();
                jNode["id"] = node.Key;
                foreach(string column in VectorData.Columns())
                {
                    jNode[column] = VectorData[column, int.Parse(node.Key)].ToString();
                }
                if(Partition != null)
                {
                    jNode["group"] = Partition[node.Key];
                }
                jNode["neighbours"] = JArray.FromObject(Network[node.Key].Keys);
                jNodes.Add(jNode);
                //jNodes.Insert(Int32.Parse(node.Key, CultureInfo.InvariantCulture), jNode);
                

                foreach(var target in node.Value)
                {
                    JObject newLink = new JObject();
                    newLink["source"] = node.Key;
                    newLink["target"] = target.Key;
                    newLink["id"] = ++edgeId;
                    jLinks.Add(newLink);
                    //jLinks.Insert(Int32.Parse(node.Key + target.Key, CultureInfo.InvariantCulture), newLink);
                }
            }

            root["nodes"] = jNodes;
            root["links"] = jLinks;

            
            string json = root.ToString();
            return json;
        }

        public string PartitionsToD3Json()
        {
            if(Partition == null)
            {
                return null;
            }

            var communities = new Dictionary<string, List<string>>();
            foreach (var kvp in Partition)
            {
                List<string> nodeset;
                if (!communities.TryGetValue(kvp.Value, out nodeset))
                {
                    nodeset = communities[kvp.Value] = new List<string>();
                }
                nodeset.Add(kvp.Key);
            }


            JObject root = new JObject();

            JArray jNodes = new JArray();
            JArray jLinks = new JArray();

            foreach (var group in communities)
            {
                JObject jNode = new JObject();
                jNode["id"] = group.Key;
                jNode["Number of Nodes"] = group.Value.Count;
                jNodes.Add(jNode);
                //jNodes.Insert(Int32.Parse(node.Key, CultureInfo.InvariantCulture), jNode);
                for(int i = int.Parse(group.Key, CultureInfo.InvariantCulture); i < communities.Count; i++)
                {
                    var item = communities.ElementAt(i);
                    double countLinks = 0;
                    foreach(var node1 in group.Value)
                    {
                        foreach (var node2 in item.Value)
                        {
                            Network[node1].TryGetValue(node2, out double value);
                            countLinks += value;
                        }
                    }
                    JObject newLink = new JObject();
                    newLink["source"] = group.Key;
                    newLink["target"] = item.Key;
                    newLink["value"] = countLinks;
                    jLinks.Add(newLink);
                }
                
            }

            root["groups"] = jNodes;
            root["links"] = jLinks;


            string json = root.ToString();
            return json;
        }


    }
}
