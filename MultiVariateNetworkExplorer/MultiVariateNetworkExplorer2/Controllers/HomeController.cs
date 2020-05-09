using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using DataUtility;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using MultiVariateNetworkExplorer.Models;
using MultiVariateNetworkExplorer2;
using MultiVariateNetworkExplorer2.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MultiVariateNetworkExplorer.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Graph(List<IFormFile> files, string separators, 
            string convert, string groupColumn, string idColumn, decimal epsilonRadius, decimal kNNmin, bool directed = false, 
            bool header = false, bool grouping = false)
        {
            
            long size = files.Sum(f => f.Length);
            var filePaths = new List<string>();

            foreach (var formFile in files)
            {
                if (formFile.Length > 0)
                {
                    var filePath = Path.GetTempFileName();
                    filePaths.Add(filePath);
                    using (var stream = System.IO.File.Create(filePath))
                    {
                        await formFile.CopyToAsync(stream);
                    }
                }
            }

            char[] separatorArray;


            if (String.IsNullOrEmpty(separators))
            {
                separatorArray = " ".ToCharArray();
            }

            else
            {
                separatorArray = separators.Trim().ToCharArray();
            }

            
        /*if (Path.GetExtension(files[0].FileName) == ".csv")
        {*/
                
            MultiVariateNetwork multiVariateNetwork = new MultiVariateNetwork(filePaths, idColumn, groupColumn, convert, (double)epsilonRadius, (int)kNNmin, grouping, directed, header, separatorArray);

            GraphModel gm = new GraphModel();
            gm.Graph = multiVariateNetwork.ToD3Json();
            gm.Selection = multiVariateNetwork.PartitionsToD3Json();
            gm.Mvn = multiVariateNetwork;
                
            return View("Graph", gm);
            //}
            
            //return View();
        }

        [HttpPost]
        public JsonResult GraphCommunityDetection(string graphFilt)
        {
            /*MultiVariateNetwork multiVariateNetwork = new MultiVariateNetwork();
            multiVariateNetwork.VectorData.Data = HttpContext.Session.GetObject<SortedDictionary<string, IList>>("dataframe");
            multiVariateNetwork.VectorData.DataCount = multiVariateNetwork.Network.NumberOfVertices =  HttpContext.Session.GetObject<int>("datacount");
            multiVariateNetwork.VectorData.NumAtrrExtremes = HttpContext.Session.GetObject<Dictionary<string, DataFrame.MinMaxStruct>>("numattr");
            multiVariateNetwork.VectorData.CatAttrValues = HttpContext.Session.GetObject<Dictionary<string, List<string>>>("catattr");
            multiVariateNetwork.Network.Data = HttpContext.Session.GetObject<Dictionary<string, Dictionary<string, double>>>("network-data");*/


            JObject root = JObject.Parse(graphFilt);
            Network filteredNetwork = new Network(root);
            JToken partitions = root["partitions"];
            

            MultiVariateNetwork mvnTemp = new MultiVariateNetwork();
            mvnTemp.FindCommunities(filteredNetwork);
            mvnTemp.Network = filteredNetwork;

            Parallel.ForEach(mvnTemp.Partition, node => {
                partitions[node.Key] = node.Value;
            });

        

            return Json(new { newPartitions = partitions.ToString(), newSelections = mvnTemp.PartitionsToD3Json()});
        }

        public IActionResult About()
        {
            ViewData["Message"] = "Your application description page.";

            return View();
        }

        public IActionResult Contact()
        {
            ViewData["Message"] = "Your contact page.";

            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        

    }

    

}
