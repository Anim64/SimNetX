using Metrics.Metrics;
using MultiVariateNetworkLibrary;
using System;
using VectorConversion.VectorDataConversion;

namespace TestApp
{
    class Program
    {
        //static double Sum<T>(T x, T y) where T : INumber<T>
        //{

        //}
        static void Main(string[] args)
        {
            //DataFrame v = new DataFrame();
            //v.ReadFromFile("iris.data", ',');

            object value = 0;
            Type t = Nullable.GetUnderlyingType(typeof(double?));
            double? doubleValue = (double?)Convert.ChangeType(value, t);
            
            MultiVariateNetwork mvn = new MultiVariateNetwork(new string[] { "./dataset.csv" }, "na", "ID fixed", null, new LRNet(), new GaussKernel(), false, false, true, ';');
            //mvn.FindCommunities();

            mvn.Network.ToFile("dataset-network.csv");
            /*Network g = new Network();
            //test network
            int edgecounter = 0;
            using (StreamReader sr = new StreamReader("karate.csv"))
            {
                string line = null;
                while ((line = sr.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (line == "") { continue; }
                    string[] d = line.Split(',');
                    string agent = d[0];
                    for (int i = 1; i < d.Length; i++)
                    {
                        string friends = d[i];
                        g.AddIndirectedEdge(agent, friends, 1);
                        edgecounter++;
                    }
                }
            }
            Console.WriteLine("{0} edges added", edgecounter);

            Stopwatch stopwatch = new Stopwatch();
            stopwatch.Restart();
            Dictionary<string, string> partition = Community.BestPartition(g);
            Console.WriteLine("BestPartition: {0}", stopwatch.Elapsed);
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
            Console.WriteLine("{0} communities found", communities.Count);
            int counter = 0;
            foreach (var kvp in communities)
            {
                Console.WriteLine("community {0}: {1} people", counter, kvp.Value.Count);
                counter++;
            }
            Console.ReadLine();*/





        }
    }
}
