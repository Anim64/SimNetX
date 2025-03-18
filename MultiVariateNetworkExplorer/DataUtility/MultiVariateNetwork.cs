using CommunityDetection;
using DataFrameLibrary;
using Metrics;
using NetworkLibrary;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using VectorConversion;

namespace MultiVariateNetworkLibrary
{
    public class MultiVariateNetwork
    {

        private static readonly string jsonNodesName = "nodes";
        private static readonly string jsonLinksName = "links";
        private static readonly string jsonPartitionsName = "partitions";
        private static readonly string jsonRealClassesName = "classes";
        private static readonly string jsonAttributesName = "attributes";
        private static readonly string jsonMetricName = "metric";
        private static readonly string jsonConversionAlgName = "conversionAlg";


        public DataFrame VectorData { get; set; }
        public Network Network { get; set; }

        public Dictionary<string, string> Partition { get; set; }

        public Dictionary<string, string> RealClasses { get; set; }

        public bool Directed { get; set; }
        public IVectorConversion ConversionAlg { get; }
        public IMetric Metric { get; }

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

        public MultiVariateNetwork(IEnumerable<string> paths, string missingvalues, string idColumn, string groupColumn, IVectorConversion convertAlg, bool doNulify, IMetric chosenMetric, bool directed = false, bool header = false, params char[] separator)
        {
            this.VectorData = new DataFrame(paths.ElementAt(0), missingvalues, idColumn, groupColumn, header, separator);

            this.Directed = directed;
            this.Partition = this.RealClasses = null;
            this.ConversionAlg = convertAlg;
            this.Metric = chosenMetric;

            this.VectorData.FindAttributeExtremesAndValues();
            this.Network = paths.Count() > 1 ? 
                Network.ReadFromFile(paths.ElementAt(1), header, directed, separator) :
                convertAlg.ConvertToNetwork(this.VectorData, chosenMetric, doNulify); ;
            this.FindCommunities();
        }

        public void FindCommunities()
        {
            this.Partition = Community.BestPartition(this.Network);
        }

        public void FindCommunities(Network network)
        {
            Dictionary<string, string> partition = Community.BestPartition(network);
            this.Partition = partition;
            foreach (var key in this.Partition.Keys)
            {
                this.Partition[key] = Utils.RemoveSpecialCharacters(this.Partition[key]);
            }

        }

        public static MultiVariateNetwork FromD3Json(JObject d3JsonRoot, bool loadNetwork = true)
        {
            JObject jNodes = (JObject)d3JsonRoot[jsonNodesName];
            JArray jLinks = (JArray)d3JsonRoot[jsonLinksName];

            JObject jAttributes = (JObject)d3JsonRoot[jsonAttributesName];

            DataFrame nodesFrame = DataFrame.FromD3Json(jNodes, jAttributes);
            
            Network network = loadNetwork ? Network.FromD3Json(null, jLinks) : null;

            JObject jPartition = (JObject)d3JsonRoot[jsonPartitionsName];
            JObject jRealClasses = (JObject)d3JsonRoot[jsonRealClassesName];

            Dictionary<string, string> partitions = jPartition.ToObject<Dictionary<string, string>>();
            Dictionary<string, string> realClasses = jRealClasses.ToObject<Dictionary<string, string>>();

            MultiVariateNetwork mvn = new MultiVariateNetwork(nodesFrame, network, partitions, realClasses);

            return mvn;
        }

        public JObject ToD3Json()
        {
            JObject root = new JObject();

            JToken jNodeData = this.VectorData.ToD3Json();
            JToken jNodes = this.VectorData.NodesToD3Json();

            
            JObject jLinkData = this.Network.ToD3Json();
            JArray jLinks = this.Network.LinksToD3Json();

            JObject jAttributes = this.VectorData.AttributesToD3Json();
            JObject jPartition = new();
            JObject jRealClasses = new();

            JObject jMetric = new()
            {
                ["name"] = this.Metric.GetType().Name,
                ["params"] = new JArray(this.Metric
                    .GetType()
                    .GetProperties()
                    .Select(p => p.GetValue(Metric)))
            };
            JObject jConversion = new()
            {
                ["name"] = this.ConversionAlg.GetType().Name,
                ["params"] = new JArray(this.ConversionAlg
                    .GetType()
                    .GetProperties()
                    .Select(p => p.GetValue(ConversionAlg)))
            };

            int dataCount = this.VectorData.DataCount;

            for (int i = 0; i < dataCount; i++)
            {
                string source = this.VectorData.IdColumn[i].ToString();
                jPartition[source] = this.Partition != null ? this.Partition[source] : string.Empty;
                jRealClasses[source] = this.RealClasses != null ? this.RealClasses[source] : string.Empty;
            }

            JObject jGraph = new()
            {
                [jsonNodesName] = jNodes,
                [jsonLinksName] = jLinks,
                [jsonPartitionsName] = jPartition,
                [jsonRealClassesName] = jRealClasses,
                [jsonAttributesName] = jAttributes,
                [jsonMetricName] = jMetric,
                [jsonConversionAlgName] = jConversion
            };

            JObject jData = new()
            {
                [jsonNodesName] = jNodeData,
                [jsonLinksName] = jLinkData
            };

            root["graph"] = jGraph;
            root["data"] = jData;
            
            return root;
        }

        public static JToken EmptyD3Json()
        {
            JObject root = new JObject();

            JToken jNodeData = new JObject();
            JToken jNodes = new JArray();

            JObject jLinkData = new();
            JArray jLinks = new JArray();

            JObject jAttributes = new JObject();

            JObject jGraph = new()
            {
                [jsonNodesName] = jNodes,
                [jsonLinksName] = jLinks,
                [jsonAttributesName] = jAttributes
            };

            root["graph"] = jGraph;

            JObject jData = new()
            {
                [jsonNodesName] = jNodeData,
                [jsonLinksName] = jLinkData
            };
            root["data"] = jData;
            
            return root;
        }

        public bool IsEmpty()
        {
            return this.VectorData.IsEmpty() && this.Network.IsEmpty();
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

            root[jsonNodesName] = jNodes;
            root[jsonLinksName] = jLinks;


            string json = root.ToString();
            return json;
        }


        public double[] calculatePrecision()
        {
            double[] result = new double[2];
            double weightedPrecision = 0, precision = 0;
            if (RealClasses == null)
            {
                return null;
            }
            foreach(var node in Network)
            {
                double nodeWeightedPrecision = 0, nodeAllWeight = 0, nodePrecision;
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
