using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using DataUtility;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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
        public async Task<IActionResult> FileUpload(IFormFile file)
        {
            long size = file.Length;

            var filePath = Path.GetTempFileName();

            if (size > 0)
            {
                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }

            }

            if(Path.GetExtension(file.FileName) == ".csv")
            {
                MultiVariateNetwork multiVariateNetwork = new MultiVariateNetwork(filePath, false, ',', ';');



                return View("Graph",multiVariateNetwork.ToD3Json());
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
