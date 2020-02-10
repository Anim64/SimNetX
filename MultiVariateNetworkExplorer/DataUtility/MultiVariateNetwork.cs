using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility
{
    public class MultiVariateNetwork
    {
        public DataFrame VectorData { get; set; }
        public Network Network { get; set; }

        public MultiVariateNetwork()
        {
            VectorData = new DataFrame();
            Network = new Network();
        }

        public MultiVariateNetwork(string fileName, bool header = false, params char[] separator)
        {
            VectorData = new DataFrame(fileName, header, separator);

            Network = VectorData.CreateNetwork(0.4, 2);
        }

        public string ToD3Json()
        {
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
                jNodes.Add(jNode);

                foreach(string target in node.Value)
                {
                    JObject newLink = new JObject();
                    newLink["source"] = node.Key;
                    newLink["target"] = target;
                    jLinks.Add(newLink);
                }
            }

            root["nodes"] = jNodes;
            root["links"] = jLinks;

            
            string json = root.ToString();

            return json;
        }


    }
}
