using DataUtility.DataStructures;
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

        private static readonly string jsonNodesName = "nodes";
        private static readonly string jsonLinksName = "links";
        private static readonly string jsonPartitionsName = "partitions";
        private static readonly string jsonRealClassesName = "classes";
        private static readonly string jsonAttributesName = "attributes";
        private static readonly string jsonIdColumnName = "id";

        private static readonly string jsonLinkSourceName = "source";
        private static readonly string jsonLinkTargetName = "target";
        private static readonly string jsonLinkValueName = "value";
        private static readonly string jsonLinkIdName = "id";

        public DataFrame VectorData { get; set; }
        public Network Network { get; set; }

        public Dictionary<string, string> Partition { get; set; }

        public Dictionary<string, string> RealClasses { get; set; }

        public bool Directed { get; set; }


        


        public MultiVariateNetwork()
        {
            this.VectorData = new DataFrame();
            this.Network = new Network(0);
            this.Partition = null;
            this.RealClasses = new Dictionary<string, string>();
            
            this.Directed = false;
        }

        public MultiVariateNetwork(DataFrame nodeFrame, Network network, Dictionary<string, string> partitions, 
            Dictionary<string, string> realClasses)
        {
            this.VectorData = nodeFrame;
            this.Network = network;
            this.Partition = partitions;
            this.RealClasses = realClasses;
            this.Directed = false;

        }

        public MultiVariateNetwork(IEnumerable<string> paths, string missingvalues, string idColumn, string groupColumn, IVectorConversion convertAlg, IMetric chosenMetric,  bool grouping, bool directed = false, bool header = false, params char[] separator)
        {
            this.VectorData = new DataFrame(paths.ElementAt(0), missingvalues, idColumn, header, separator);
            ColumnString dataFrameIdColumn = this.VectorData.IdColumn;

            this.Directed = directed;
            this.Partition = null;
            this.RealClasses = null;

            
            
            if (!String.IsNullOrEmpty(groupColumn))
            {
                groupColumn = Utils.RemoveDiacritics(groupColumn);
                Dictionary<string, string> groups = new Dictionary<string, string>();
                bool isParsable = int.TryParse(groupColumn, out int result);
                var columnList = isParsable ? this.VectorData["Attribute" + groupColumn] : this.VectorData[groupColumn];
                this.VectorData.RemoveColumn(isParsable ? "Attribute" + groupColumn : groupColumn);
                this.RealClasses = new Dictionary<string, string>();

                for (int i = 0; i < columnList.DataCount; i++)
                {
                    groups[dataFrameIdColumn[i].ToString()] = columnList[i].ToString();
                    RealClasses[dataFrameIdColumn[i].ToString()] = columnList[i].ToString();
                }

                this.Partition = groups;
            }

            this.VectorData.FindAttributeExtremesAndValues();
            this.Network = paths.Count() > 1 ? 
                Network.ReadFromFile(paths.ElementAt(1), header, directed, separator) :
                convertAlg.ConvertToNetwork(this.VectorData, chosenMetric); ;

            if(grouping && this.Partition == null)
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

        public static MultiVariateNetwork FromD3Json(JObject d3JsonRoot, bool loadNetwork = false)
        {
            JArray jNodes = (JArray)d3JsonRoot[jsonNodesName];
            JArray jLinks = (JArray)d3JsonRoot[jsonLinksName];

            JObject jAttributes = (JObject)d3JsonRoot[jsonAttributesName];

            DataFrame nodesFrame = DataFrame.FromD3Json(jNodes, jAttributes);
            
            Network network = loadNetwork ? Network.FromD3Json(jLinks) : null;

            JObject jPartition = (JObject)d3JsonRoot[jsonPartitionsName];
            JObject jRealClasses = (JObject)d3JsonRoot[jsonRealClassesName];

            Dictionary<string, string> partitions = jPartition.ToObject<Dictionary<string, string>>();
            Dictionary<string, string> realClasses = jRealClasses.ToObject<Dictionary<string, string>>();

            MultiVariateNetwork mvn = new MultiVariateNetwork(nodesFrame, network, partitions, realClasses);


            return mvn;
        }

        public JObject ToD3Json()
        {
            int edgeId = -1;

            JObject root = new JObject();

            JArray jNodes = new JArray();
            JArray jLinks = new JArray();

            JObject jAttributes = new JObject();
            jAttributes[jsonIdColumnName] = this.VectorData.IdColumnName;
            foreach(var column in this.VectorData)
            {
                jAttributes[column.Key] = column.Value is ColumnDouble ? JToken.FromObject(IColumn.ColumnTypes.Double) : JToken.FromObject(IColumn.ColumnTypes.String);
            }
            JObject jPartition = new JObject();
            JObject jRealClasses = new JObject();

            int dataCount = this.VectorData.DataCount;

            for (int i = 0; i < dataCount; i++)
            {
                JObject jNode = new JObject();
                var source = this.VectorData.IdColumn[i].ToString();
                var links = this.Network[source];
                jNode[jsonIdColumnName] = source;
                foreach (string column in this.VectorData.Columns)
                {
                    jNode[column] = this.VectorData[column, i] != null ? JToken.FromObject(this.VectorData[column, i]) : JValue.CreateNull();
                }

                jPartition[source] = this.Partition != null ? this.Partition[source] : string.Empty;
                jRealClasses[source] = this.RealClasses != null ? this.RealClasses[source] : string.Empty;
                jNodes.Add(jNode);


                foreach (var target in this.Network[source].Where(kv => string.Compare(source, kv.Key) < 0))
                {

                    JObject newLink = new JObject
                    {
                        [jsonLinkSourceName] = source,
                        [jsonLinkTargetName] = target.Key,
                        [jsonLinkValueName] = target.Value,
                        [jsonLinkIdName] = ++edgeId
                    };
                    jLinks.Add(newLink);


                }
            }

            root[jsonNodesName] = jNodes;
            root[jsonLinksName] = jLinks;
            root[jsonPartitionsName] = jPartition;
            root[jsonRealClassesName] = jRealClasses;
            root[jsonAttributesName] = jAttributes;

            return root;
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
