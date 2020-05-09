using Newtonsoft.Json.Linq;
using System;
using System.Collections;
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

        public IList IdColumn { get; set; }

        


        public MultiVariateNetwork()
        {
            VectorData = new DataFrame();
            Network = new Network(0);
            Partition = null;
        }

        public MultiVariateNetwork(IEnumerable<string> paths, string idColumn, string groupColumn, string convert, double simThresh, int k,  bool grouping, bool directed = false, bool header = false, params char[] separator)
        {
            VectorData = new DataFrame(paths.ElementAt(0), header, separator);
            Directed = directed;
            Partition = null;
            IdColumn = null;

            if (!String.IsNullOrEmpty(idColumn))
            {

                bool isParsable = int.TryParse(idColumn, out int result);
                IdColumn = isParsable ? this.VectorData["Attribute" + groupColumn] : this.VectorData[groupColumn];
                this.VectorData.RemoveColumn(isParsable ? "Attribute" + groupColumn : groupColumn);

            }

            else
            {
                IdColumn = Enumerable.Range(0, this.VectorData.DataCount).ToList();
            }

            if (!String.IsNullOrEmpty(groupColumn))
            {
                Dictionary<string, string> groups = new Dictionary<string, string>();
                bool isParsable = int.TryParse(groupColumn, out int result);
                var columnList = isParsable ? this.VectorData["Attribute" + groupColumn] : this.VectorData[groupColumn];
                this.VectorData.RemoveColumn(isParsable ? "Attribute" + groupColumn : groupColumn);

                for (int i = 0; i < columnList.Count; i++)
                {
                    groups[i.ToString()] = columnList[i].ToString();
                }

                this.Partition = groups;
            }


            if (paths.Count() > 1)
            {
                Network.ReadFromFile(paths.ElementAt(1), header, directed, separator);
            }
            else
            {
                if (convert.Equals("LRNet"))
                {
                    Network = VectorData.LRNet(IdColumn);
                }
                else
                {
                    Network = VectorData.ToNetwork(simThresh, k, IdColumn);
                }
            }

            if(grouping && Partition == null)
            {
                this.FindCommunities();
            }
            
        }
        public void FindCommunities()
        {
            Dictionary<string, string> partition = Community.BestPartition(this.Network);
            this.Partition = partition;
        }

        public void FindCommunities(Network network)
        {
            Dictionary<string, string> partition = Community.BestPartition(network);
            this.Partition = partition;
        }

        public string ToD3Json()
        {
            int edgeId = -1;
            JObject root = new JObject();

            JArray jNodes = new JArray();
            JArray jLinks = new JArray();
            JObject jPartition = new JObject();

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
                    //jNode["group"] = Partition[node.Key];
                    jPartition[node.Key] = Partition[node.Key];
                }
                else
                {
                    jPartition[node.Key] = "";
                }
                jNode["neighbours"] = JArray.FromObject(Network[node.Key].Keys);
                jNodes.Add(jNode);
                //jNodes.Insert(Int32.Parse(node.Key, CultureInfo.InvariantCulture), jNode);
                

                foreach(var target in node.Value)
                {
                    JObject newLink = new JObject();
                    newLink["source"] = node.Key;
                    newLink["target"] = target.Key;
                    newLink["value"] = target.Value;
                    newLink["id"] = ++edgeId;
                    jLinks.Add(newLink);
                    //jLinks.Insert(Int32.Parse(node.Key + target.Key, CultureInfo.InvariantCulture), newLink);
                }
            }

            root["nodes"] = jNodes;
            root["links"] = jLinks;
            root["partitions"] = jPartition;

            
            string json = root.ToString();
            return json;
        }

        public string EmptyD3Json()
        {
            JObject root = new JObject();

            JArray jNodes = new JArray();
            JArray jLinks = new JArray();

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

            int edgeId = -1;

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

                foreach (var group1 in communities)
                {
                    JObject jNode = new JObject();
                    jNode["id"] = group1.Key;
                    jNode["nonodes"] = group1.Value.Count;
                    jNodes.Add(jNode);
                    //jNodes.Insert(Int32.Parse(node.Key, CultureInfo.InvariantCulture), jNode);
                    foreach (var group2 in communities)
                    {
                        
                        double countLinks = 0;
                        foreach (var node1 in group1.Value)
                        {
                            foreach (var node2 in group2.Value)
                            {
                                Network[node1].TryGetValue(node2, out double value);
                                countLinks += value;
                            }
                        }
                        JObject newLink = new JObject();
                        newLink["source"] = group1.Key;
                        newLink["target"] = group2.Key;
                        newLink["value"] = countLinks;
                        newLink["id"] = ++edgeId;
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
