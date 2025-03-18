using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;
using DataFrameLibrary;
using Matrix;
using Metrics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Build.Framework;
using Microsoft.Extensions.Logging;
using MultiVariateNetworkExplorer.Models;
using MultiVariateNetworkExplorer2.Models;
using MultiVariateNetworkLibrary;
using NetworkLibrary;
using Newtonsoft.Json.Linq;
using NuGet.Common;
using VectorConversion;
using static Metrics.Enums.ParameterEnums;

namespace MultiVariateNetworkExplorer.Controllers
{
    
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        [Authorize]
        private bool GraphErrorHandling(out ErrorInputModel eim, List<IFormFile> files, string separators, string missingvalues,
             string groupColumn, string idColumn)

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

        [Authorize]
        public IActionResult Graph()
        {
            ApplicationModels model = new();
            //ErrorInputModel gm = new ErrorInputModel();
            TempData["ErrorMessage"] = null;
            return View("Graph", model);
        }

       [HttpPost, Authorize]
        //public async Task<IActionResult> LoadGraph(List<IFormFile> files, string separators, string missingvalues,
        //    string convert, double[] algsParams, string metric, double[] metricParams, string groupColumn, string idColumn, decimal epsilonRadius, decimal kNNmin, BooleanParameter directed = BooleanParameter.False,
        //    BooleanParameter header = BooleanParameter.False, BooleanParameter grouping = BooleanParameter.False)
        public async Task<IActionResult> LoadGraph([FromForm] InputModel inputModel)
        {

            if (!GraphErrorHandling(out ErrorInputModel eim, inputModel.Files, inputModel.Separators, inputModel.MissingValues
                ,inputModel.GroupColumnName, inputModel.IdColumnName))
            {
                TempData["ErrorMessage"] = "Input files were not loaded correctly.";
                return Redirect(HttpContext.Request.Headers["Referer"].ToString());
            }

            long size = inputModel.Files.Sum(f => f.Length);
            var filePaths = new List<string>();

            foreach (var formFile in inputModel.Files)
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

            char[] separatorArray = string.IsNullOrEmpty(inputModel.Separators) ? " ".ToCharArray() : inputModel.Separators.Trim().ToCharArray();


            bool hasHeaders = inputModel.Header == BooleanParameter.Yes;
            bool isDirected = inputModel.Directed == BooleanParameter.Yes;
            bool doCommunityDetection = inputModel.CommunityDetection == BooleanParameter.Yes;

            Type metricType = typeof(IMetric).Assembly.GetTypes().Single(t => t.Name == inputModel.MetricName);
            object[] metricParams = inputModel.MetricParams?.Cast<object>().ToArray();
            IMetric chosenMetric = (IMetric)Activator.CreateInstance(metricType, metricParams);

            Type conversionType = typeof(IVectorConversion).Assembly.GetTypes().Single(t => t.Name == inputModel.ConversionAlgorithmName);
            var conversionAlgorithmParams = inputModel.ConversionAlgorithmParams.Cast<object>().ToArray();
            IVectorConversion chosenConversion = (IVectorConversion)Activator.CreateInstance(conversionType, conversionAlgorithmParams);

            try
            {
                MultiVariateNetwork multiVariateNetwork = new(filePaths, inputModel.MissingValues, inputModel.IdColumnName, inputModel.GroupColumnName, chosenConversion,
                inputModel.Nulify ,chosenMetric, doCommunityDetection, isDirected, hasHeaders, separatorArray);

                GraphModel gm = new(multiVariateNetwork);
                ApplicationModels appModel = new(gm);

                ModelState.Clear();
                return View("Graph", appModel);
            }
            catch (Exception e)
            {
                TempData["ErrorMessage"] = e.Message;
                return Redirect(HttpContext.Request.Headers["Referer"].ToString());
            }
        }

        [HttpPost, Authorize]
        public async Task<IActionResult> LoadAndAppendNodes(string currentGraph, List<IFormFile> files, string separators, string missingvalues,
            string convert, string metric, List<double> algsParams, List<double> metricParams, string groupColumn, string idColumn,
            BooleanParameter header = BooleanParameter.No)
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

            bool hasHeaders = header == BooleanParameter.Yes;

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

        [HttpPost, Authorize]
        public async Task<JsonResult> RemodelNetwork(string nodes, string attributes, string attributeTransform, string networkRemodelParams, string excludedAttributes)
        {
            JObject jNodes = JObject.Parse(nodes);
            JObject jAttributes = JObject.Parse(attributes);
            JObject jAttributeTransform = JObject.Parse(attributeTransform);
            JObject jNetworkRemodelParams = JObject.Parse(networkRemodelParams);
            JArray jExcludedAttributes = JArray.Parse(excludedAttributes);

            //JObject jNodes = (JObject)data["nodes"];
            //JObject jAttributes = (JObject)data["attributes"];
            //JObject jAttributeTransform = (JObject)data["attributeTransform"];
            //JObject jNetworkRemodelParams = (JObject)data["networkRemodelParams"];
            //JArray jExcludedAttributes = (JArray)data["excludedAttributes"];

            DataFrame nodeAttributes = DataFrame.FromD3Json(jNodes, jAttributes);

            await nodeAttributes.ApplyJsonTransformationAsync(jAttributeTransform);

            List<string> excludedAttributesList = jExcludedAttributes.ToObject<List<string>>();

            JToken jMetric = jNetworkRemodelParams["metric"];
            Type metricType = typeof(IMetric).Assembly.GetTypes().Single(t => t.Name == jMetric["name"].ToString());
            object[] metricParams = jMetric["params"].ToObject<object[]>();
            bool doNulify = jMetric["nulify"].ToObject<bool>();
            IMetric chosenMetric = (IMetric)Activator.CreateInstance(metricType, metricParams);

            JToken jAlgorithm = jNetworkRemodelParams["algorithm"];
            Type conversionType = typeof(IVectorConversion).Assembly.GetTypes().Single(t => t.Name == jAlgorithm["name"].ToString());
            object[] algorithmParams = jAlgorithm["params"].ToObject<object[]>();
            
            IVectorConversion chosenConversion = (IVectorConversion)Activator.CreateInstance(conversionType, algorithmParams);


            // TODO: Return only transformed columns and then assign then into global json graph
            Network remodeledNetwork = chosenConversion.ConvertToNetwork(nodeAttributes, chosenMetric, doNulify, excludedAttributesList);
            return Json(new { newVectorData = jAttributeTransform.HasValues ? 
                nodeAttributes.ToD3Json().ToString() : 
                JValue.CreateNull().ToString(), 
                newNetwork = remodeledNetwork.LinksToD3Json().ToString() }); 
            
        }


        [HttpPost, Authorize]
        public JsonResult GraphCommunityDetection(string nodes, string links)
        {
            this._logger.LogInformation("Starting community detection...");
            
            JArray jNodes = JArray.Parse(nodes);
            JArray jLinks = JArray.Parse(links);
            Network filteredNetwork = Network.FromD3Json(jNodes, jLinks);

            MultiVariateNetwork mvnTemp = new ();
            mvnTemp.FindCommunities(filteredNetwork);
            mvnTemp.Network = filteredNetwork;

            JObject partitions = new();
            foreach (var node in mvnTemp.Partition)
            {
                partitions[node.Key] = node.Value;
            }

            this._logger.LogInformation("Finished community detection...");
            return Json(new { newPartitions = partitions.ToString(), newSelections = mvnTemp.PartitionsToD3Json()});
        }

        [HttpPost, Authorize]
        public JsonResult GetSilhouette(string nodes, string attributes, string partitions, string excludedAttributes, string metric)
        {
            JObject jNodes = JObject.Parse(nodes);
            JObject jAttributes = JObject.Parse(attributes);
            JObject jMetric = JObject.Parse(metric);
            List<string> excludedAttributesList = JArray.Parse(excludedAttributes).ToObject<List<string>>();

            Dictionary<string, string> partitionsDict = 
                JObject.Parse(partitions)
                .ToObject<Dictionary<string, string>>();

            DataFrame data = DataFrame.FromD3Json(jNodes, jAttributes);

            Type metricType = typeof(IMetric).Assembly.GetTypes().Single(t => t.Name == jMetric["name"].ToString());
            object[] metricParams = jMetric["params"].ToObject<object[]>();
            bool doNulify = false;// jMetric["nulify"].ToObject<bool>();
            IMetric chosenMetric = (IMetric)Activator.CreateInstance(metricType, metricParams);
            Matrix<double> metricMat = chosenMetric.GetMetricMatrix(data, doNulify, excludedAttributesList);

            //Get the silhouette
            Dictionary<string, double> silhouette = data.Silhouette(partitionsDict, metricMat);


            JArray silhouetteData = new();
            foreach(var partitionsPair in partitionsDict)
            {
                string nodeId = partitionsPair.Key;
                JObject plotData = new();
                plotData["x"] = nodeId;
                plotData["y"] = silhouette[nodeId];
                silhouetteData.Add(plotData);
            }
            
            
            return Json(new { silhouetteData = silhouetteData.ToString() });
        }


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            ViewData["Message"] = "There was an error while loading your data, check if you have filled every parameter correctly";
            return View("Index", new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        

    }

    

}
