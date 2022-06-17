using DataUtility.DataStructures.Metrics;
using DataUtility.DataStructures.VectorDataConversion;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;

namespace DataUtility
{
    public class MultiVariateNetwork
    {
        public DataFrame VectorData { get; set; }
        public Network Network { get; set; }

        public Dictionary<string, string> Partition { get; set; }

        public Dictionary<string, string> RealClasses { get; set; }

        public bool Directed { get; set; }

        public ColumnString IdColumn { get; set; }


        public MultiVariateNetwork()
        {
            VectorData = new DataFrame();
            Network = new Network(0);
            Partition = null;
            RealClasses = new Dictionary<string, string>();
        }

        public MultiVariateNetwork(IEnumerable<string> paths, string missingvalues, string idColumn, string groupColumn, IVectorConversion convertAlg, IMetric chosenMetric,  bool grouping, bool directed = false, bool header = false, params char[] separator)
        {
            VectorData = new DataFrame(paths.ElementAt(0), missingvalues, header, separator);
            Directed = directed;
            Partition = null;
            IdColumn = null;
            RealClasses = null;

            if (!String.IsNullOrEmpty(idColumn))
            {

                bool isParsable = int.TryParse(idColumn, out int result);
                IdColumn = isParsable ? (ColumnString)this.VectorData["Attribute" + idColumn] : (ColumnString)this.VectorData[idColumn];
                this.VectorData.RemoveColumn(isParsable ? "Attribute" + idColumn : idColumn);

            }

            else
            {
                IdColumn = new ColumnString(Enumerable.Range(0, this.VectorData.DataCount).Select(id => id.ToString()).ToList());
            }
            
            if (!String.IsNullOrEmpty(groupColumn))
            {
                Dictionary<string, string> groups = new Dictionary<string, string>();
                bool isParsable = int.TryParse(groupColumn, out int result);
                var columnList = isParsable ? this.VectorData["Attribute" + groupColumn] : this.VectorData[groupColumn];
                this.VectorData.RemoveColumn(isParsable ? "Attribute" + groupColumn : groupColumn);
                RealClasses = new Dictionary<string, string>();

                for (int i = 0; i < columnList.DataCount; i++)
                {
                    groups[IdColumn[i].ToString()] = columnList[i].ToString();
                    RealClasses[IdColumn[i].ToString()] = columnList[i].ToString();
                }

                this.Partition = groups;
            }

            VectorData.FindAttributeExtremesAndValues();


            if (paths.Count() > 1)
            {
                this.Network = Network.ReadFromFile(paths.ElementAt(1), header, directed, separator);
            }
            else
            {

                this.Network = convertAlg.ConvertToNetwork(this.VectorData, chosenMetric, IdColumn);
                
            }

            if(grouping && Partition == null)
            {
                this.FindCommunities();
                //PartitionsToFile();
            }

            /*if(Partition != null)
            {
                PartitionsToFile();
            }*/

           
            
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
            JArray jAttributes = new JArray(this.VectorData.Columns);
            JObject jPartition = new JObject();
            JObject jRealClasses = new JObject();

            for(int i = 0; i < this.IdColumn.DataCount; i++)
            {
                JObject jNode = new JObject();
                var source = IdColumn[i].ToString();
                var links = this.Network[source];
                jNode["id"] = source;
                foreach(string column in VectorData.Columns)
                {
                    jNode[column] = VectorData[column, i] != null ? JToken.FromObject(VectorData[column, i]) : "";
                }
                if(Partition != null)
                {
                    //jNode["group"] = Partition[node.Key];
                    jPartition[source] = Partition[source];
                }
                else
                {
                    jPartition[source] = "";
                }

                if(RealClasses != null)
                {
                    jRealClasses[source] = RealClasses[source];
                }

                else
                {
                    jRealClasses[source] = "";
                }
                //jNode["neighbours"] = JArray.FromObject(Network[node.Key].Keys);
                jNodes.Add(jNode);
                

                foreach(var target in this.Network[source].Where(kv => String.Compare(source, kv.Key) < 0))
                {
                    
                    JObject newLink = new JObject();
                    newLink["source"] = source;
                    newLink["target"] = target.Key;
                    newLink["value"] = target.Value;
                    newLink["id"] = ++edgeId;
                    jLinks.Add(newLink);
                    
                    
                }
            }

            var count = this.Network.NumberOfEdges;
            root["nodes"] = jNodes;
            root["links"] = jLinks;
            root["partitions"] = jPartition;
            root["classes"] = jRealClasses;
            root["attributes"] = jAttributes;

            
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


        public double[] calculatePrecision()
        {
            double[] result = new double[2];
            double weightedPrecision = 0;
            double precision = 0;
            if(RealClasses == null)
            {
                return null;
            }
            foreach(var node in Network)
            {
                double nodeWeightedPrecision = 0;
                double nodeAllWeight = 0;
                double nodePrecision;
                foreach(var edge in node.Value)
                {
                    if(RealClasses[node.Key].Equals(RealClasses[edge.Key]))
                    {
                        nodeWeightedPrecision += edge.Value;
                    }
                    nodeAllWeight += edge.Value;
                }

                weightedPrecision += nodeWeightedPrecision / nodeAllWeight;
                nodePrecision = nodeWeightedPrecision > (nodeAllWeight - nodeWeightedPrecision) ? 1 : 0;
                precision += nodePrecision;
            }

            result[0] = weightedPrecision / Network.NumberOfVertices;
            result[1] = precision / Network.NumberOfVertices;

            return result;
        }

        public Dictionary<string, List<double>> Support()
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

            var realclasses = new Dictionary<string, List<string>>();
            foreach (var kvp in RealClasses)
            {
                List<string> nodeset;
                if (!realclasses.TryGetValue(kvp.Value, out nodeset))
                {
                    nodeset = realclasses[kvp.Value] = new List<string>();
                }
                nodeset.Add(kvp.Key);
            }


            Dictionary<string, List<double>> supportDict = new Dictionary<string, List<double>>();
            if (Partition != null)
            {
                foreach (var partition in communities)
                {
                    if (!supportDict.TryGetValue(partition.Key, out List<double> support))
                    {
                        supportDict[partition.Key] = new List<double>();
                        supportDict[partition.Key].Add(0);
                        supportDict[partition.Key].Add(0);
                    }
                    supportDict[partition.Key][0] = partition.Value.Count;
                }

                foreach (var partition in communities)
                {
                    double numberOfCommons = 0;
                    foreach (var realclass in realclasses)
                    {

                        if(partition.Value.Intersect(realclass.Value).Count() > numberOfCommons)
                        {
                            numberOfCommons = partition.Value.Intersect(realclass.Value).Count();
                        }

                        


                    }

                    supportDict[partition.Key][1] = numberOfCommons / supportDict[partition.Key][0];
                }

                foreach(var key in supportDict.Keys)
                {
                    supportDict[key][0] = supportDict[key][0] / Partition.Count;
                }
             
            }

            return supportDict;
        }

        public void PartitionsToFile()
        {
            using (StreamWriter sw = new StreamWriter("groups.txt"))
            {
                foreach(var pair in this.Partition)
                {

                    sw.WriteLine(pair.Value);
                }
            }

        }

    }
}
