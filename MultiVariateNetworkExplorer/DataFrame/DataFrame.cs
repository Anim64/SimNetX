using Columns;
using Columns.TransformationComposite.Transformations;
using Columns.Transforms;
using Columns.Types;
using DataFrameLibrary.DataFrameExceptions;
using Matrix;
using Newtonsoft.Json.Linq;
using ServerModels;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Numerics;
using System.Reflection;
using System.Reflection.PortableExecutable;
using System.Resources;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using static Columns.Enums.ColumnEnums;

namespace DataFrameLibrary;

public class DataFrame : IEnumerable<KeyValuePair<string, IColumn>>
{
    private static readonly string exceptionMessageResourceName = "DataUtility.DataStructures.DataFrameExceptions.ExceptionMessages";

    private static readonly string jsonIdColumnName = "id";

    /// <summary>
    /// A dataframe that holds vector data
    /// </summary>
    public Dictionary<string, IColumn> Data { get; set; }

    public IEnumerable<string> Columns { 
        get 
        {
            return this.Data.Keys;
        } 
    }
    /// <summary>
    /// Gets the number of rows in the dataframe.
    /// </summary>
    public int DataCount { get; set; }

    public string IdColumnName { get; private set; }
    public ColumnString IdColumn { get; set; }

    /// <summary>
    /// Contains extremes of numerical attributes.
    /// </summary>
    public Dictionary<string, ColumnExtremesStruct> NumAtrrExtremes { get; set; }

    /// <summary>
    /// Contains distinct values for every categorical column.
    /// </summary>
    public Dictionary<string, List<string>> CatAttrValues { get; set; }

    public Dictionary<string, double> Averages { get; set; }

    /// <summary>
    /// Creates an empty dataframe.
    /// </summary>
    public DataFrame()
    {
        Data = new Dictionary<string, IColumn>();
        DataCount = 0;
        IdColumnName = null;
        IdColumn = new ColumnString();

        NumAtrrExtremes = new Dictionary<string, ColumnExtremesStruct>();
        CatAttrValues = new Dictionary<string, List<string>>();

    }


    public DataFrame(JObject jAttributes)
    {
        Data = new Dictionary<string, IColumn>();
        DataCount = 0;
        IdColumnName = jAttributes["id"] != null ? jAttributes["id"].ToObject<string>() : null;
        jAttributes.Remove("id");
        IdColumn = new ColumnString();

        NumAtrrExtremes = new Dictionary<string, ColumnExtremesStruct>();
        CatAttrValues = new Dictionary<string, List<string>>();

        foreach (var property in jAttributes["num"])
        {
            string header = property.ToString();
            this.Data[header] = new ColumnDouble();
        }

        foreach (var property in jAttributes["cat"])
        {
            string header = property.ToString();
            this.Data[header] = new ColumnString();
        }
        
    }

    /// <summary>
    /// Creates a dataframe and fills it with data form a file.
    /// </summary>
    /// <param name="fileName"></param>
    /// <param name="missingvalues"></param>
    /// <param name="header"></param>
    /// <param name="separator"></param>
    public DataFrame(string fileName, List<AttributeInfoModel> attributes, string missingvalues, string idColumn, bool header = false, params char[] separator)
    {
        Data = new Dictionary<string, IColumn>();
        DataCount = 0;

        NumAtrrExtremes = new Dictionary<string, ColumnExtremesStruct>();
        CatAttrValues = new Dictionary<string, List<string>>();

        this.ReadFromFile(fileName, attributes, missingvalues, header, separator);

        if (string.IsNullOrEmpty(idColumn))
        {
            IdColumnName = null;
            IdColumn = new ColumnString(Enumerable.Range(0, this.DataCount).Select(id => id.ToString()).ToList());
            return;
        }
        
        idColumn = Utils.RemoveDiacritics(idColumn);
        bool isParsable = int.TryParse(idColumn, out int result);
        IdColumnName =
            (isParsable ? "Attribute" + idColumn : idColumn)
            .Trim()
            .RemoveSpecialCharacters()
            .HandleInvalidStartingChar();
        
    }

    /// <summary>
    /// </summary>
    /// <param name="i">The row index</param>
    /// <returns>Return a single row from source DataFrame as a new DataFrame</returns>
    public DataFrame this[params int[] rows]
    {
        get
        {
            DataFrame selectedRows = new DataFrame();
            foreach(var pair in Data)
            {
                selectedRows.Data.Add(pair.Key, (IColumn)Activator.CreateInstance(pair.Value.GetType()));

                foreach(int row in rows)
                {
                    selectedRows.Data[pair.Key].AddData(this.Data[pair.Key].Data[row]);
                }
            }
            return selectedRows;
        }
    }

    /// <summary>
    /// </summary>
    /// <param name="column"></param>
    /// <returns>An instance of class that implements <see cref="IColumn"/> interface</returns>
    public IColumn this[string column]
    {
        get
        {
            return this.Data[column];
        }
    }

    /// <summary>
    /// </summary>
    /// <param name="column"></param>
    /// <param name="row"></param>
    /// <returns>The value at a specified row and column</returns>
    public object this[string column, int row]
    {
        get
        {
            return this.Data[column].Data[row];
        }

        set
        {
            try
            {
                var type = this.Data[column].Data[row].GetType();
                var convertedValue = Convert.ChangeType(value, type);
                this.Data[column].Data[row] = convertedValue;
            }
            catch(Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }
    }

    public bool IsEmpty()
    {
        return this.Data.Count == 0;
    }

    public bool ContainsColumn(string columnName)
    {
        return this.Data.ContainsKey(columnName);
    }

    public Dictionary<int, double> RowAverages(IEnumerable<int> rowIndeces = null)
    {
        Dictionary<int, double> result = new Dictionary<int, double>();
        if(rowIndeces is not null)
        {
            foreach (int rowIndex in rowIndeces)
            {
                double rowAverage = 0;
                foreach (string columnName in this.Columns)
                {
                    IColumn column = this[columnName];
                    if (column is ColumnDouble)
                    {
                        double? value = ((ColumnDouble)column)[rowIndex];
                        if (value != null)
                        {
                            rowAverage += (double)value;
                        }
                    }
                }

                result[rowIndex] = rowAverage;
            }

            return result;
        }

        for (int rowIndex = 0; rowIndex < this.DataCount; rowIndex++)
        {
            double rowAverage = 0;
            foreach (string columnName in this.Columns)
            {
                IColumn column = this[columnName];
                if (column is ColumnDouble)
                {
                    double? value = ((ColumnDouble)column)[rowIndex];
                    rowAverage += value != null ? Convert.ToDouble(value) : this.Averages[columnName];
                }
            }

            result[rowIndex] = rowAverage;
        }

        return result;
    }

    public Dictionary<string, double> ColumnAverages(bool inplace = false, params string[] columns)
    {
        Dictionary<string, double> result = new Dictionary<string, double>();

        IEnumerable<string> columnList = columns.Length > 0 ? columns : this.Columns;

        foreach(var column in columnList)
        {
            IColumn columnValueList = this[column];
            if(columnValueList is ColumnDouble)
            {
                result[column] = ((ColumnDouble)columnValueList).Average();
            }
        }

        if (inplace)
        {
            this.Averages = result;
        }
        return result;
    }

    public Dictionary<string, double> Silhouette(Dictionary<string, string> partitions, Matrix<double> metricMat) 
    {
        Dictionary<string, double> silhouette = new();
        for(int i = 0; i < this.DataCount; i++)
        {
            string iNodeId = this.IdColumn[i];
            Dictionary<string, int> partitionNodeCount = new() { [partitions[iNodeId]] = 1 };
            Dictionary<string, double> averageSimilarities = new() { [partitions[iNodeId]] = 0 };
            for(int j = 0; j < this.DataCount; j++)
            {
                if (i == j) continue;
                string jNodeId = this.IdColumn[j];
                string jNodePartitions = partitions[jNodeId];
                if (!partitionNodeCount.TryGetValue(jNodePartitions, out int count))
                {
                    partitionNodeCount[jNodePartitions] = 1;
                    averageSimilarities[jNodePartitions] = 0;
                }

                partitionNodeCount[jNodePartitions]++;
                averageSimilarities[jNodePartitions] += metricMat[i,j];
            }

            if(partitionNodeCount[partitions[iNodeId]] < 2)
            {
                silhouette[iNodeId] = 0;
                continue;
            }

            foreach (var partition in averageSimilarities.Keys)
            {
                averageSimilarities[partition] /= partitionNodeCount[partition];
            }

            double a_i = averageSimilarities[partitions[iNodeId]];
            averageSimilarities.Remove(partitions[iNodeId]);
            var simMaxPartition = averageSimilarities.MaxBy(kvp => kvp.Value);
            double b_i = simMaxPartition.Value;

            silhouette[iNodeId] = (a_i - b_i) / (Math.Max(a_i, b_i));

        }
        return silhouette;
    }

    /// <summary>
    /// Finds and extremes and distinct values for all column and saves them to <see cref="NumAtrrExtremes"/> and <see cref="CatAttrValues"/>.
    /// </summary>
    public void FindAttributeExtremesAndValues()
    {
        foreach (var column in this.Data)
        {
            if (column.Value is ColumnDouble)
            {
                double min = double.PositiveInfinity;
                double max = double.NegativeInfinity;
                
                foreach (var value in column.Value)
                {
                    if(value is null)
                    {
                        continue;
                    }
                    double dValue = Convert.ToDouble(value);

                    if (dValue > max)
                        max = dValue;

                    if (dValue < min)
                        min = dValue;
                }

                this.NumAtrrExtremes[column.Key] = new ColumnExtremesStruct(min, max);
                continue;
            }

            this.CatAttrValues[column.Key] = ((List<string>)column.Value.Data).Distinct().ToList();
        }

    }

    public async Task<List<string>> ApplyJsonTransformationAsync(JObject jAttributeTransform)
    {
        return await Task.Run(() =>
        {
                List<string> newTransformedColumnNames = new List<string>();
                foreach (var attribute in jAttributeTransform)
                {
                    ColumnDouble columnValues = (ColumnDouble)this[attribute.Key];
                    ColumnDouble transformedColumn = new ColumnDouble(columnValues);

                    List<string> attributeTransforms = attribute.Value.ToObject<List<string>>();
                    TransformComposite transforms = new TransformComposite();
                    StringBuilder transformedColumnNameSB = new StringBuilder(attribute.Key).Append('-');

                        foreach (var transform in attributeTransforms)
                        {
                            ITransformComponent component = null;
                            switch (transform)
                            {
                                case "normalize":
                                    {
                                        component = new NormalizeTransformation();
                                        transformedColumnNameSB.Append('n');
                                        break;
                                    }
                                case "rescale":
                                    {
                                        component = new RescaleTransformation();
                                        transformedColumnNameSB.Append('r');
                                        break;
                                    }
                                case "standardize":
                                    {
                                        component = new StandardizeTransformation();
                                        transformedColumnNameSB.Append('s');
                                        break;
                                    }
                                case "distribute":
                                    {
                                        component = new LogToNormalDistributionTransformation();
                                        transformedColumnNameSB.Append('l');
                                        break;
                                    }
                                default:
                                    {
                                        break;
                                    }

                            }

                            if (component is not null)
                            {
                                transforms.Add(component);
                            }
                        }
                
                        string newTransformedColumnName = transformedColumnNameSB.ToString();
                        if (!this.ContainsColumn(newTransformedColumnName))
                        {
                            transforms.ApplyTransformation(transformedColumn);
                            this.AddColumn(newTransformedColumnName, transformedColumn);
                            newTransformedColumnNames.Add(newTransformedColumnName);
                        }
                
                };

                this.ColumnAverages(inplace: true);
                return newTransformedColumnNames;
        });
            
    }

    private bool IsValueMissing(string value, string missingValues)
    {
        return string.IsNullOrEmpty(value) || value == missingValues;
    }

    /// <summary>
    /// Creates attribute headers
    /// </summary>
    /// <param name="sr"></param>
    /// <param name="hasHeaders"></param>
    /// <param name="vector"></param>
    /// <param name="separator"></param>
    /// <returns></returns>
    private string[] PrepareHeaders(StreamReader sr, bool hasHeaders, string line, ref string[] vector, params char[] separator)
    {
        string[] headers;
        if (hasHeaders)
        {
            line = line.RemoveDiacritics();
            headers = line.Split(separator);

            for (int i = 0; i < headers.Length; i++)
            {

                headers[i] = headers[i]
                    .Trim()
                    .RemoveSpecialCharacters()
                    .HandleInvalidStartingChar();
                    
            }

            if ((line = sr.ReadLine()) is not null)
            {
                vector = line.Trim().Split(separator);
            }
            return headers;
        }

        vector = line.Trim().Split(separator);
        int columnCount = vector.Length;
        headers = new string[columnCount];
        for (int j = 0; j < columnCount; j++)
        {
            headers[j] = $"Attr{(j + 1)}";
        }

        return headers;

            
    }
    private void PrepareHeaders(List<AttributeInfoModel> attributes)
    {
        for (int i = 0; i < attributes.Count; i++)
        {
            attributes[i].Name = attributes[i].Name
                .RemoveDiacritics()
                .Trim()
                .RemoveSpecialCharacters()
                .HandleInvalidStartingChar();
        }
    }

    private string[] GetHeadersFromFile(StreamReader sr, bool hasHeaders, params char[] separators)
    {
        if (hasHeaders)
        {
            string line;
            var resourceManager = new ResourceManager(exceptionMessageResourceName, Assembly.GetExecutingAssembly());

            if ((line = sr.ReadLine()) is not null)
            {
                string[] headers;
                line = line.RemoveDiacritics();
                headers = Regex.Replace(line, @"[\%\+\/\*\(\)]+", "").Split(separators);
                for (int i = 0; i < headers.Length; i++)
                {
                    headers[i] = Regex.Replace(headers[i], @"[\s]+", "-");
                }

                string[] commonHeaders = headers.Intersect(this.Columns).ToArray();
                    
                if (commonHeaders.Count() != this.Columns.Count())
                {
                    throw new ColumnsDoNotMatchException(resourceManager.GetString("ColumnsDoNotMatch"));
                }

                return commonHeaders;
            }

            throw new EmptyFileException(resourceManager.GetString("EmptyFile"));
        }

        return this.Columns.ToArray();
    }


    /// <summary>
    /// Determines the column data types based on the first column
    /// </summary>
    /// <param name="headers"></param>
    /// <param name="vector"></param>
    /// <param name="emptyAtrributeCount"></param>
    /// <param name="nullIndeces"></param>
    /// <param name="averages"></param>
    private void PrepareColumns(string[] headers, string[] vector, string missingValues, Dictionary<string, int> emptyAtrributeCount, Dictionary<string, List<int>> nullIndeces, 
        Dictionary<string, double> averages)
    {
        int columnCount = headers.Length;
        for (int i = 0; i < columnCount; i++)
        {
            string header = headers[i];
            string vectorValue = i < vector.Length ? vector[i] : "";
            nullIndeces[header] = new List<int>();
            averages[header] = 0;

            if (header == IdColumnName)
            {
                this.Data[header] = new ColumnString();
                this.Data[header].AddData(vectorValue);
                continue;
            }

            if (IsValueMissing(vectorValue, missingValues) || i >= vector.Length)
            {
                emptyAtrributeCount[header] = 1;
                nullIndeces[header].Add(0);
                continue;
            }

            

            bool isParsable = (double.TryParse(vectorValue.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat) && header != "ID");
            if (isParsable)
            {
                this.Data[header] = new ColumnDouble();
                this.Data[header].AddData(resultFloat);
                averages[header] += resultFloat;
                continue;

            }

            this.Data[header] = new ColumnString();
            this.Data[header].AddData(vectorValue);
        }
    }

    private void PrepareColumns(List<AttributeInfoModel> attributes)
    {
        foreach (var attribute in attributes)
        {
            if(attribute.Type == "Numeric")
            {
                this.Data[attribute.Name] = new ColumnDouble();
                continue;
            }

            this.Data[attribute.Name] = new ColumnString();
        }
    }

    private void AddDataFromLine(string[] headers, string[] vector, string missingValues)
    {

        if(IdColumnName is null)
        {
            this.IdColumn.AddData(this.IdColumn.DataCount.ToString());
        }
        for (int i = 0; i < headers.Length; i++)
        {
            //keys.MoveNext();
            /*if (this.Data[headers[i]] is List<int>)
                this.Data[headers[i]].Add(int.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));*/
            string header = headers[i];
            string vectorValue = i < vector.Length ?  vector[i] : "";
            if (header == this.IdColumnName)
            {
                this.IdColumn.AddData(vectorValue);
                continue;
            }

            if (IsValueMissing(vectorValue, missingValues))
            {
                this.Data[header].AddData(null);
                continue;
            }

            bool isParsable = double.TryParse(vectorValue.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat);

            if (isParsable)
            {
                this.Data[header].AddData(resultFloat);
                continue;

            }

            this.Data[header].AddData(vectorValue);
        }
    }

    /// <summary>
    /// Adds data from file line to DataFrame
    /// </summary>
    /// <param name="headers"></param>
    /// <param name="vector"></param>
    /// <param name="missingValues"></param>
    /// <param name="emptyAtrributeCount"></param>
    /// <param name="nullIndeces"></param>
    /// <param name="averages"></param>
    private void AddDataFromLine(string[] headers, string[] vector, string missingValues, Dictionary<string, int> emptyAtrributeCount, 
        Dictionary<string, List<int>> nullIndeces, Dictionary<string, double> averages)
    {
        for (int i = 0; i < headers.Length; i++)
        {
            string header = headers[i];

            string vectorValue = i < vector.Length ? vector[i] : "";
            bool isParsable = double.TryParse(vectorValue.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat);

            if (emptyAtrributeCount.ContainsKey(header))
            {

                if (IsValueMissing(vectorValue, missingValues))
                {
                    emptyAtrributeCount[header]++;
                    continue;

                }


                if (isParsable)
                {
                    this.Data[header] = new ColumnDouble();

                }
                else
                {
                    this.Data[header] = new ColumnString();
                }
                    

                for (int j = 0; j < emptyAtrributeCount[header]; j++)
                {
                    nullIndeces[header].Add(j);
                    this.Data[header].AddData(null);
                }

                emptyAtrributeCount.Remove(header);
            }

            if (IsValueMissing(vectorValue, missingValues))
            {
                this.Data[header].AddData(null);
                nullIndeces[header].Add(DataCount);
                continue;
            }

            if (isParsable)
            {
                this.Data[header].AddData(resultFloat);
                averages[header] += resultFloat;
                continue;

            }

            this.Data[header].AddData(vectorValue);
        }
    }

    /// <summary>
    /// Reads vector data from a file and saves them to Dataframe
    /// </summary>
    /// <param name="filename"></param>
    /// <param name="header"></param>
    /// <param name="separator"></param>
    public void ReadFromFile(string filename, string missingvalues, bool header = false, params char[] separator)
    {
        Dictionary<string, int> emptyAtrributeCount = new Dictionary<string, int>();
        Dictionary<string, List<int>> nullIndeces = new Dictionary<string, List<int>>();
        Dictionary<string, double> averages = new Dictionary<string, double>();
            
        using (StreamReader sr = new StreamReader(filename))
        {

            string[] headers = null;
            string[] vector = null;
            string line = null;

            if ((line = sr.ReadLine()) != null)
            {
                        
                headers = PrepareHeaders(sr, header, line, ref vector, separator);
                PrepareColumns(headers, vector, missingvalues, emptyAtrributeCount, nullIndeces, averages);
                DataCount++;

                //Load Data to Frame
                while ((line = sr.ReadLine()) != null)
                {

                    line = line.Trim();
                    if (line == "")
                    {
                        continue;
                    }

                    vector = line.Split(separator);

                    AddDataFromLine(headers, vector, missingvalues, emptyAtrributeCount, nullIndeces, averages);

                    DataCount++;
                }

                foreach (var attribute in emptyAtrributeCount)
                {
                    this.Data[attribute.Key] = new ColumnString(attribute.Value);
                }

                foreach (var attribute in this)
                {
                    if(attribute.Value.DataCount <= 0)
                    {
                        this.RemoveColumn(attribute.Key);
                    }
                }

                this.Averages = averages;
                FindAttributeExtremesAndValues();

                if(IdColumnName is not null)
                {
                    IdColumn = this[IdColumnName].ToColumnString();
                    IdColumn.Map(Utils.RemoveDiacritics);
                    IdColumn.Map(Utils.RemoveSpecialCharacters);
                    this.RemoveColumn(IdColumnName);
                }

                return;
            }

            var resourceManager = new ResourceManager(exceptionMessageResourceName, Assembly.GetExecutingAssembly());
            throw new EmptyFileException(resourceManager.GetString("EmptyFile"));
        }
    }

    public void ReadFromFile(string filename, List<AttributeInfoModel> attributes, string missingvalues, bool header = false, params char[] separator)
    {
        PrepareHeaders(attributes);
        PrepareColumns(attributes);
        Dictionary<string, double> averages = new Dictionary<string, double>();
        foreach (var attribute in attributes)
        {
            averages[attribute.Name] = 0;
        }
        using (StreamReader sr = new StreamReader(filename))
        {
            string[] vector = null;
            string line = null;

            if (header)
            {
                sr.ReadLine();
            }


            //Load Data to Frame
            while ((line = sr.ReadLine()) != null)
            {

                line = line.Trim();
                if (line == "")
                {
                    continue;
                }

                vector = line.Split(separator);

                for (int i = 0; i < attributes.Count; i++)
                {
                    string vectorValue = vector[i];
                    string attrName = attributes[i].Name;
                    string type = attributes[i].Type;
                    if (string.IsNullOrEmpty(vectorValue) || vectorValue == missingvalues)
                    {
                        this.Data[attrName].AddData(null);
                        continue;
                    }

                    if (attributes[i].Type == "Numeric")
                    {

                        bool isParsable = double.TryParse(vector[i].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double value);
                        this.Data[attrName].AddData(isParsable ? value : null);
                        averages[attrName] += value;
                        continue;
                    }

                    this.Data[attrName].AddData(vectorValue);
                }

                DataCount++;
            }
            foreach (var attribute in this)
            {
                if (attribute.Value.DataCount <= 0)
                {
                    this.RemoveColumn(attribute.Key);
                }
            }

            foreach (var attribute in averages.Keys)
            {
                averages[attribute] /= DataCount;
            }

            this.Averages = averages;
            FindAttributeExtremesAndValues();

            if (IdColumnName is not null)
            {
                IdColumn = this[IdColumnName].ToColumnString();
                IdColumn.Map(Utils.RemoveDiacritics);
                IdColumn.Map(Utils.RemoveSpecialCharacters);
                this.RemoveColumn(IdColumnName);
            }

            return;
        }
    }
      
        

    public void ReadAndAppendFromFile(string filename, string missingvalues, bool header = false, params char[] separator)
    {
            
            using (StreamReader sr = new StreamReader(filename))
            {

                string[] headers = GetHeadersFromFile(sr, header, separator);
                string[] vector = null;
                string line = null;
                    
                //Load Data to Frame
                while ((line = sr.ReadLine()) != null)
                {

                    line = line.Trim();
                    if (line == "")
                    {
                        continue;
                    }

                    vector = line.Split(separator);

                    AddDataFromLine(headers, vector, missingvalues);

                    DataCount++;
                }
            }
            this.Averages = ColumnAverages();
            FindAttributeExtremesAndValues();
    }


    public void AddColumn(string header, Type columnType)
    {
        this.Data.Add(header, (IColumn)Activator.CreateInstance(columnType));
    }

    public void AddColumn(string header, IColumn column)
    {
        this.Data.Add(header, column);
    }

    /// <summary>
    /// Removes the specified column.
    /// </summary>
    /// <param name="column"></param>
    public void RemoveColumn(string column)
    {
        this.Data.Remove(column);
    }

    public static DataFrame FromD3Json(JObject jNodes, JObject jAttributes)
    {
        DataFrame df = new(jAttributes);
            
        foreach (var node in jNodes)
        {
            df.IdColumn.AddData(node.Key.ToString());
            foreach (string column in df.Columns)
            {
                JToken attributeValue = node.Value[column];
                object value = attributeValue.ToString() is not null ? attributeValue.ToObject<object>() : null;
                df[column].AddData(value);
            }
            df.DataCount++;
        }

        df.ColumnAverages(inplace: true);

        return df;
            
    }

    public JToken ToD3Json()
    {
        
        JObject jNodeData = new ();
        
        for (int i = 0; i < this.DataCount; i++)
        {
            string source = this.IdColumn[i].ToString();

            JObject jData = new ();
            foreach (string column in this.Columns)
            {
                jData[column] = this[column, i] != null ? JToken.FromObject(this[column, i]) : JValue.CreateNull();
            }
            jNodeData[source] = jData;
        }

        return jNodeData;
    }

    public JArray NodesToD3Json()
    {
        JArray jNodeGraph = new();
        for (int i = 0; i < this.DataCount; i++)
        {
            string source = this.IdColumn[i].ToString();

            JObject jNode = new()
            {
                [jsonIdColumnName] = source
            };
            jNodeGraph.Add(jNode);
        }
        return jNodeGraph;
    }

    public JObject AttributesToD3Json()
    {

        JObject jAttributes = new ()
        {
            [jsonIdColumnName] = this.IdColumnName
        };

        
        JArray jNumAttributes = new();
        JArray jCatAttributes = new();

        foreach (var column in this.Data)
        {
            if(column.Value is ColumnDouble)
            {
                jNumAttributes.Add(column.Key);
                continue;
            }
            jCatAttributes.Add(column.Key);
        }

        const string jsonNumAttributeName = "num";
        const string jsonCatAttributeName = "cat";

        jAttributes[jsonNumAttributeName] = jNumAttributes;
        jAttributes[jsonCatAttributeName] = jCatAttributes;

        return jAttributes;
    }



    IEnumerator IEnumerable.GetEnumerator()
    {
        return this.Data.GetEnumerator();
    }

    IEnumerator<KeyValuePair<string, IColumn>> IEnumerable<KeyValuePair<string, IColumn>>.GetEnumerator()
    {
        return this.Data.GetEnumerator();
    }
}

