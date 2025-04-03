using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Options;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using static Metrics.Enums.ParameterEnums;

namespace MultiVariateNetworkExplorer2.Models
{
    public class InputModel
    {
        public IFormFile File { get; set; }
        public string Separators { get; set; }
        public string MissingValues { get; set; }
        public string ConversionAlgorithmName { get; set; }
        public List<double> ConversionAlgorithmParams { get; set; }
        public string MetricName { get; set; }
        public bool Nulify { get; set; }
        public List<double> MetricParams { get; set; }
        public string IdColumnName { get; set; }

        public BooleanParameter Header { get; set; }

        public List<SelectListItem> YesNoList { get; } = new() 
        {
            new SelectListItem { Text = BooleanParameter.Yes.ToString(), Value = ((int)BooleanParameter.Yes).ToString(), Selected=true },
            new SelectListItem { Text = BooleanParameter.No.ToString(), Value = ((int)BooleanParameter.No).ToString() }
        };

        public List<SelectListItem> AlgorithmList { get; } = new()
        {
            new SelectListItem { Text = "LRNet", Value = "LRNet", Selected=true },
            new SelectListItem { Text = "Epsilon and kNN", Value = "EpsilonKNN" }
        };

        public List<SelectListItem> MetricList { get; } = new()
        {
            new SelectListItem { Text = "Gaussian Kernel", Value = "GaussKernel", Selected=true },
            new SelectListItem { Text = "Cosine Similarity", Value = "CosineSimilarity" },
            new SelectListItem { Text = "Pearson Correlation", Value = "PearsonCorrelation" },
            new SelectListItem { Text = "Spearman Correlation", Value = "SpearmanCorrelation" },
            new SelectListItem { Text = "Cooccurance", Value = "CooccuranceSimilarity" },
            new SelectListItem { Text = "Jaccard", Value = "JaccardSimilarity" },
            new SelectListItem { Text = "Euclidean Distance", Value = "EuclideanKernel" }
        };

    }
}
