using LouvainCommunityPL;
using Metrics.Metrics;
using MultiVariateNetworkLibrary;
using NetworkLibrary;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using VectorConversion.VectorDataConversion;

namespace TestApp
{
    class Program
    {
        //static double Sum<T>(T x, T y) where T : INumber<T>
        //{

        //}
        static int keySize = 64;
        static int hashIterations = 250000;
        static HashAlgorithmName hashAlgorithm = HashAlgorithmName.SHA512;


        private static string HashPassword(string password, out byte[] salt)
        {
            salt = RandomNumberGenerator.GetBytes(keySize);

            var hash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                hashIterations,
                hashAlgorithm,
                keySize);

            return Convert.ToHexString(hash);

        }

        static void TestLouvainOriginal()
        {
            Graph g = new Graph();
            //test network
            int edgecounter = 0;
            using (StreamReader sr = new StreamReader("ecoli-network.csv"))
            {
                string line = null;
                while ((line = sr.ReadLine()) != null)
                {
                    line = line.Trim();
                    if (line == "") { continue; }
                    string[] d = line.Split(';');
                    int from = Int32.Parse(d[0]);
                    int to = Int32.Parse(d[1]);
                    g.AddEdge(from, to, 1);
                    edgecounter++;

                }
            }
            Console.WriteLine("{0} edges added", edgecounter);

            Stopwatch stopwatch = new Stopwatch();
            stopwatch.Restart();
            Dictionary<int, int> partition = Community.BestPartition(g);
            Console.WriteLine("BestPartition: {0}", stopwatch.Elapsed);
            var communities = new Dictionary<int, List<int>>();
            foreach (var kvp in partition)
            {
                List<int> nodeset;
                if (!communities.TryGetValue(kvp.Value, out nodeset))
                {
                    nodeset = communities[kvp.Value] = new List<int>();
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
        }

        static void TestLouvainMine()
        {
            //MultiVariateNetwork mvn = new MultiVariateNetwork(
            //    new string[] { "C:\\Projects\\Networks_in_biomedicine_article\\python-analysis\\MVNE datasety\\ecoli2.csv" },
            //    "na", null, null, new LRNet(1, 1), false, new GaussKernel(),
            //    false, false, true, new char[] { ';' });

            //mvn.FindCommunities();
        }

        static void Main(string[] args)
        {
            //TestLouvainOriginal();
            //TestLouvainMine();

            //Console.ReadLine();
            //MultiVariateNetwork mvn = new MultiVariateNetwork(
            //    new string[] { "C:\\Projects\\Networks_in_biomedicine_article\\python-analysis\\MVNE datasety\\ecoli2.csv" },
            //    "na", null, null, new LRNet(1, 1), false, new GaussKernel(),
            //    false, false, true, new char[] { ';' });

            //mvn.FindCommunities();


            byte[] salt;
            string hash = HashPassword("123456", out salt);
            string saltString = Convert.ToHexString(salt);

        XDocument doc = XDocument.Load("C:\\Users\\Standard\\source\\repos\\MultiVariateNetworkExplorer\\MultiVariateNetworkExplorer\\MultiVariateNetworkExplorer2\\wwwroot\\db\\xml\\users_db.xml");
            XElement newUser = new XElement("user");
            newUser.Add(new XAttribute("name", "kkubikova"));
            newUser.Add(new XAttribute("salt", saltString));
            newUser.Add(new XAttribute("hash", hash));

            doc.Root.Add(newUser);
            doc.Save("C:\\Users\\Standard\\source\\repos\\MultiVariateNetworkExplorer\\MultiVariateNetworkExplorer\\MultiVariateNetworkExplorer2\\wwwroot\\db\\xml\\users_db.xml");


            //DataFrame v = new DataFrame();
            //v.ReadFromFile("iris.data", ',');

            //object value = 0;
            //Type t = Nullable.GetUnderlyingType(typeof(double?));
            //double? doubleValue = (double?)Convert.ChangeType(value, t);



            //mvn.Network.ToFile("ecoli-network.csv");
            //LRNet lRNet = new LRNet(1, 1);
            //GaussKernel gaussKernel = new GaussKernel();
            //Network resultNet = lRNet.ConvertToNetwork(mvn.VectorData, gaussKernel, new List<string>() { "Consistency", "Relevant-consistency" });

            //resultNet.ToFile("havirov-network.csv");
            /*Network g = new Network();
            

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
