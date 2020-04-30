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

        public Dictionary<string, string> Partition { get; set; }

        public bool Directed { get; set; }

        


        public MultiVariateNetwork()
        {
            VectorData = new DataFrame();
            Network = new Network(0);
            Partition = null;
        }

        public MultiVariateNetwork(IEnumerable<string> paths, bool directed = false, bool header = false, params char[] separator)
        {
            VectorData = new DataFrame(paths.ElementAt(0), header, separator);
            Directed = directed;

            if(paths.Count() > 1)
            {
                Network.ReadFromFile(paths.ElementAt(1), header, directed, separator);
            }
            else
            {
                Network = VectorData.LRNet();
            }
            Partition = null;
        }
        public void FindCommunities()
        {
            Dictionary<string, string> partition = Community.BestPartition(Network);
            /*var communities = new Dictionary<string, List<string>>();
            foreach (var kvp in partition)
            {
                List<string> nodeset;
                if (!communities.TryGetValue(kvp.Value, out nodeset))
                {
                    nodeset = communities[kvp.Value] = new List<string>();
                }
                nodeset.Add(kvp.Key);
            }*/
            this.Partition = partition;
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
           

            


            JObject root = new JObject();

            JArray jNodes = new JArray();
            JArray jLinks = new JArray();

            if (Partition != null)
            {
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

                foreach (var group in communities)
                {
                    JObject jNode = new JObject();
                    jNode["id"] = group.Key;
                    jNode["Number of Nodes"] = group.Value.Count;
                    jNodes.Add(jNode);
                    //jNodes.Insert(Int32.Parse(node.Key, CultureInfo.InvariantCulture), jNode);
                    for (int i = int.Parse(group.Key, CultureInfo.InvariantCulture); i < communities.Count; i++)
                    {
                        var item = communities.ElementAt(i);
                        double countLinks = 0;
                        foreach (var node1 in group.Value)
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
            }

            root["nodes"] = jNodes;
            root["links"] = jLinks;


            string json = root.ToString();
            return json;
        }


    }
}
