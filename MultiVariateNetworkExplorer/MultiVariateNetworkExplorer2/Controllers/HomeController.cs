using System;
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

                return View("Graph", multiVariateNetwork);
            }
            
            return View();
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
