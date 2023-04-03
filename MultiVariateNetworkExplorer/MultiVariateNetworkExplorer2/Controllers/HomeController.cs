using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using DataFrameLibrary;
using Metrics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MultiVariateNetworkExplorer.Models;
using MultiVariateNetworkExplorer2.Models;
using MultiVariateNetworkLibrary;
using NetworkLibrary;
using Newtonsoft.Json.Linq;
using VectorConversion;
using static Metrics.Enums.ParameterEnums;

namespace MultiVariateNetworkExplorer.Controllers
{
    public class HomeController : Controller
    {
        private bool GraphErrorHandling(out ErrorInputModel eim, List<IFormFile> files, string separators, string missingvalues,
            string convert, string metric, string groupColumn, string idColumn, decimal epsilonRadius, decimal kNNmin, BooleanParameter directed,
            BooleanParameter header, BooleanParameter grouping)
        {
            eim = new ErrorInputModel();
            if (files.Count == 0)
            {

                eim.ErrorMessage = "Please insert your data file";
                eim.Separators = separators;
                eim.MissingValues = missingvalues;
                eim.IdColumn = idColumn;
                eim.GroupColumn = groupColumn;

                return false;
            }

            return true;

        }

        
        public IActionResult Graph()
        {
            GraphModel gm = new GraphModel();
            //ErrorInputModel gm = new ErrorInputModel();
            TempData["ErrorMessage"] = null;
            return View("Graph", gm);
        }

       [HttpPost]
        public async Task<IActionResult> LoadGraph(List<IFormFile> files, string separators, string missingvalues,
            string convert, string metric, double[] algsParams, double[] metricParams, string groupColumn, string idColumn, decimal epsilonRadius, decimal kNNmin, BooleanParameter directed = BooleanParameter.False,
            BooleanParameter header = BooleanParameter.False, BooleanParameter grouping = BooleanParameter.False)
        {

            if (!GraphErrorHandling(out ErrorInputModel eim, files, separators, missingvalues, convert,
                metric, groupColumn, idColumn, epsilonRadius, kNNmin, directed, header, grouping))
            {
                TempData["ErrorMessage"] = "Input files were not loaded correctly.";
                return Redirect(HttpContext.Request.Headers["Referer"].ToString());
            }

            long size = files.Sum(f => f.Length);
            var filePaths = new List<string>();

            foreach (var formFile in files)
            {
                if (formFile.Length <= 0)
                {
                    TempData["ErrorMessage"] = "The input file was empty. Please check if you have inserted the correct file.";
                    return Redirect(HttpContext.Request.Headers["Referer"].ToString());
                }

                var filePath = Path.GetTempFileName();
                filePaths.Add(filePath);
                using (var stream = System.IO.File.Create(filePath))
                {
                    await formFile.CopyToAsync(stream);
                }
            }

            char[] separatorArray = string.IsNullOrEmpty(separators) ? " ".ToCharArray() : separators.Trim().ToCharArray();


            bool hasHeaders = header == BooleanParameter.True;
            bool isDirected = directed == BooleanParameter.True;
            bool doCommunityDetection = grouping == BooleanParameter.True;

            Type metricType = typeof(IMetric).Assembly.GetTypes().Single(t => t.Name == metric);
            IMetric chosenMetric = (IMetric)Activator.CreateInstance(metricType, metricParams.Cast<object>().ToArray());

            Type conversionType = typeof(IVectorConversion).Assembly.GetTypes().Single(t => t.Name == convert);
            IVectorConversion chosenConversion = (IVectorConversion)Activator.CreateInstance(conversionType, algsParams.Cast<object>().ToArray());

            

            try
            {
                MultiVariateNetwork multiVariateNetwork = new MultiVariateNetwork(filePaths, missingvalues, idColumn, groupColumn, chosenConversion,
                chosenMetric, doCommunityDetection, isDirected, hasHeaders, separatorArray);

                GraphModel gm = new GraphModel(multiVariateNetwork);

                ModelState.Clear();
                return View("Graph", gm);
            }
            catch (Exception e)
            {
                TempData["ErrorMessage"] = e.Message;
                return Redirect(HttpContext.Request.Headers["Referer"].ToString());
            }
        }

        [HttpPost]
        public async Task<IActionResult> LoadAndAppendNodes(string currentGraph, List<IFormFile> files, string separators, string missingvalues,
            string convert, string metric, List<double> algsParams, List<double> metricParams, string groupColumn, string idColumn,
            BooleanParameter header = BooleanParameter.False)
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

            char[] separatorArray = string.IsNullOrEmpty(separators) ? " ".ToCharArray() : separators.Trim().ToCharArray();

            bool hasHeaders = header == BooleanParameter.True;

            Type metricType = typeof(IMetric).Assembly.GetTypes().Single(t => t.Name == metric);
            IMetric chosenMetric = (IMetric)Activator.CreateInstance(metricType, metricParams.Cast<object>().ToArray());

            Type conversionType = typeof(IVectorConversion).Assembly.GetTypes().Single(t => t.Name == convert);
            IVectorConversion chosenConversion = (IVectorConversion)Activator.CreateInstance(conversionType, algsParams.Cast<object>().ToArray());


            MultiVariateNetwork currentMvn = MultiVariateNetwork.FromD3Json(JObject.Parse(currentGraph));
            try
            {
                currentMvn.VectorData.ReadAndAppendFromFile(filePaths.ElementAt(0), missingvalues, hasHeaders, separatorArray);
            }
            catch(Exception dfe)
            {
                GraphModel gme = new GraphModel(currentMvn);
                TempData["ErrorMessage"] = dfe.Message;
                return View("Graph", gme);
            }

            currentMvn.Network = chosenConversion.ConvertToNetwork(currentMvn.VectorData, chosenMetric);

            for(int i = currentMvn.Partition.Count; i < currentMvn.VectorData.DataCount; i++)
            {
                string id = currentMvn.VectorData.IdColumn.Data[i].ToString();
                currentMvn.Partition[id] = currentMvn.RealClasses[id] = string.Empty;
                
            }

            GraphModel gm = new GraphModel(currentMvn);
            return View("Graph", gm);
        }

        [HttpPost]
        public async Task<JsonResult> RemodelNetwork(string nodes, string attributes, string attributeTransform, string networkRemodelParams, string excludedAttributes)
        {
            JArray jNodes = JArray.Parse(nodes);
            JObject jAttributes = JObject.Parse(attributes);
            JObject jAttributeTransform = JObject.Parse(attributeTransform);
            JObject jNetworkRemodelParams = JObject.Parse(networkRemodelParams);
            JArray jExcludedAttributes = JArray.Parse(excludedAttributes);
            
            DataFrame nodeAttributes = DataFrame.FromD3Json(jNodes, jAttributes);

            await nodeAttributes.ApplyJsonTransformationAsync(jAttributeTransform);

            List<string> excludedAttributesList = jExcludedAttributes.ToObject<List<string>>();

            JToken jMetric = jNetworkRemodelParams["metric"];
            Type metricType = typeof(IMetric).Assembly.GetTypes().Single(t => t.Name == jMetric["name"].ToString());
            object[] metricParams = jMetric["params"].ToObject<object[]>();
            IMetric chosenMetric = (IMetric)Activator.CreateInstance(metricType, metricParams);

            JToken jAlgorithm = jNetworkRemodelParams["algorithm"];
            Type conversionType = typeof(IVectorConversion).Assembly.GetTypes().Single(t => t.Name == jAlgorithm["name"].ToString());
            object[] algorithmParams = jAlgorithm["params"].ToObject<object[]>();
            IVectorConversion chosenConversion = (IVectorConversion)Activator.CreateInstance(conversionType, algorithmParams);


            //TODO Return only transformed columns and then assign then into global json graph
            Network remodeledNetwork = chosenConversion.ConvertToNetwork(nodeAttributes, chosenMetric, excludedAttributesList);
            return Json(new { newVectorData = jAttributeTransform.HasValues ? 
                nodeAttributes.ToD3Json().ToString() : 
                JValue.CreateNull().ToString(), 
                newNetwork = remodeledNetwork.ToD3Json().ToString() }); 
            
        }

        [HttpPost]
        public JsonResult GraphCommunityDetection(string graphNodes, string graphLinks)
        {
          
            JArray nodes = JArray.Parse(graphNodes);
            JArray links = JArray.Parse(graphLinks);
            Network filteredNetwork = Network.FromD3Json(links);
            JObject partitions = new JObject();

            MultiVariateNetwork mvnTemp = new MultiVariateNetwork();

            mvnTemp.FindCommunities(filteredNetwork);
            mvnTemp.Network = filteredNetwork;


            foreach (var node in mvnTemp.Partition)
            {
                partitions[node.Key] = node.Value;
            }


            return Json(new { newPartitions = partitions.ToString(), newSelections = mvnTemp.PartitionsToD3Json()});
        }


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            ViewData["Message"] = "There was an error while loading your data, check if you have filled every parameter correctly";
            return View("Index", new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        

    }

    

}
