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
            string convert, string groupColumn, decimal epsilonRadius, decimal kNNmin, bool directed = false, 
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

            
            if (Path.GetExtension(files[0].FileName) == ".csv")
            {
                
                MultiVariateNetwork multiVariateNetwork = new MultiVariateNetwork(filePaths, directed, header, separators.Trim().ToCharArray());

                
                if (grouping)
                {
                    if (!String.IsNullOrEmpty(groupColumn))
                    {
                        Dictionary<string, string> groups = new Dictionary<string, string>();
                        bool isParsable = int.TryParse(groupColumn, out int result);
                        var columnList = isParsable ? multiVariateNetwork.VectorData["Attribute" + groupColumn] : multiVariateNetwork.VectorData[groupColumn];
                        multiVariateNetwork.VectorData.RemoveColumn(isParsable ? "Attribute" + groupColumn : groupColumn);

                        for (int i = 0; i < columnList.Count; i++)
                        {
                            groups[i.ToString()] = columnList[i].ToString();
                        }

                        multiVariateNetwork.Partition = groups;
                    }
                    else
                    {
                        multiVariateNetwork.FindCommunities();
                    }
                }
                GraphModel gm = new GraphModel();
                gm.Graph = multiVariateNetwork.ToD3Json();
                gm.Selection = multiVariateNetwork.PartitionsToD3Json();
                gm.Store = multiVariateNetwork.EmptyD3Json();
                gm.Filter = new JObject().ToString();
                gm.Mvn = multiVariateNetwork;

                HttpContext.Session.SetObject("network-data", multiVariateNetwork.Network.Data);
                HttpContext.Session.SetObject("dataframe", multiVariateNetwork.VectorData.Data);
                HttpContext.Session.SetObject("numattr", multiVariateNetwork.VectorData.NumAtrrExtremes);
                HttpContext.Session.SetObject("catattr", multiVariateNetwork.VectorData.CatAttrValues);
                HttpContext.Session.SetObject("datacount", multiVariateNetwork.VectorData.DataCount);


                
                return View("Graph", gm);
            }
            
            return View();
        }

        [HttpPost]
        public JsonResult GraphCommunityDetection(string graphFilt)
        {
            MultiVariateNetwork multiVariateNetwork = new MultiVariateNetwork();
            multiVariateNetwork.VectorData.Data = HttpContext.Session.GetObject<SortedDictionary<string, IList>>("dataframe");
            multiVariateNetwork.VectorData.DataCount = multiVariateNetwork.Network.NumberOfVertices =  HttpContext.Session.GetObject<int>("datacount");
            multiVariateNetwork.VectorData.NumAtrrExtremes = HttpContext.Session.GetObject<Dictionary<string, DataFrame.MinMaxStruct>>("numattr");
            multiVariateNetwork.VectorData.CatAttrValues = HttpContext.Session.GetObject<Dictionary<string, List<string>>>("catattr");
            multiVariateNetwork.Network.Data = HttpContext.Session.GetObject<Dictionary<string, Dictionary<string, double>>>("network-data");


            JObject root = JObject.Parse(graphFilt);
            Network filteredNetwork = new Network(root);

            MultiVariateNetwork mvnTemp = new MultiVariateNetwork();
            mvnTemp.FindCommunities(filteredNetwork);
            mvnTemp.Network = filteredNetwork;

            foreach(var node in root["nodes"])
            {
                node["group"] = mvnTemp.Partition[(string)node["id"]];
            }

            JArray newLinks = new JArray();
            foreach(var link in root["links"])
            {
                JObject newLink = new JObject();
                newLink["source"] = (string)link["source"]["id"];
                newLink["target"] = (string)link["target"]["id"];
                newLink["value"] = (string)link["value"];
                newLinks.Add(newLink);
            }
            root["links"] = newLinks;

            /*GraphModel gm = new GraphModel();
            gm.Mvn = multiVariateNetwork;
            gm.Store = storeFilt;
            gm.Filter = attrFilt;*/

            return Json(new { newGraph = root.ToString(), newSelections = mvnTemp.PartitionsToD3Json()});
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
