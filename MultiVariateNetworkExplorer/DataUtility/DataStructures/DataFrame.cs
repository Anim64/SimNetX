using DataUtility.DataStructures.DataFrameExceptions;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data.Common;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection.PortableExecutable;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using static DataUtility.DataStructures.ColumnEnums;

namespace DataUtility
{
    public class DataFrame : IEnumerable<KeyValuePair<string, IColumn>>
    {
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

        public Dictionary<string, double> Averages 
        {
            get;
            set; 
        }

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

            foreach (var property in jAttributes)
            {
                string header = property.Key;
                ColumnTypes columnTypeNumber = property.Value.ToObject<ColumnTypes>();

                if(columnTypeNumber == ColumnTypes.Double)
                {
                    this.Data[header] = new ColumnDouble();
                    continue;
                }

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
        public DataFrame(string fileName, string missingvalues, string idColumn, bool header = false, params char[] separator)
        {
            Data = new Dictionary<string, IColumn>();
            DataCount = 0;

            NumAtrrExtremes = new Dictionary<string, ColumnExtremesStruct>();
            CatAttrValues = new Dictionary<string, List<string>>();

            this.ReadFromFile(fileName, missingvalues, header, separator);

            if (!String.IsNullOrEmpty(idColumn))
            {
                idColumn = Utils.RemoveDiacritics(idColumn);
                bool isParsable = int.TryParse(idColumn, out int result);
                IdColumnName = isParsable ? "Attribute" + idColumn : idColumn;
                IdColumn = this[IdColumnName].ToColumnString();
                this.RemoveColumn(IdColumnName);
            }

            else
            {
                IdColumnName = null;
                IdColumn = new ColumnString(Enumerable.Range(0, this.DataCount).Select(id => id.ToString()).ToList());
            }


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

        
        /*public DataFrame this[params string[] columns]
        {
            
            get
            {
                DataFrame selectedColumns = new DataFrame();

                foreach(string column in columns)
                {
                    selectedColumns.dataFrame.Add(column, this.dataFrame[column]);
                }

                return selectedColumns;
            }

        }*/


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

        public Dictionary<string, double> CalculateAverages(params string[] columns)
        {
            Dictionary<string, double> result = new Dictionary<string, double>();

            IEnumerable<string> columnList = columns.Length > 0 ? columns : this.Columns;

            foreach(var column in columnList)
            {
                IColumn columnValueList = this[column];
                if(columnValueList is ColumnDouble)
                {
                    double average = ((ColumnDouble)columnValueList).Sum() / this.DataCount;
                    result[column] = average;
                }
            }

            return result;
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
                
                    foreach (var value in column.Value.Data)
                    {
                        if(value == null)
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
                }

                else if (column.Value is ColumnString)
                {
                    this.CatAttrValues[column.Key] = ((List<string>)column.Value.Data).Distinct().ToList();
                }
            }

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
                headers = Regex.Replace(line, @"[\%\+\/\*\(\)]+", "").Split(separator);
                for (int i = 0; i < headers.Length; i++)
                {
                    headers[i] = Regex.Replace(headers[i], @"[\s]+", "");
                }

                if ((line = sr.ReadLine()) != null)
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

        private string[] GetHeadersFromFile(StreamReader sr, bool hasHeaders, params char[] separators)
        {
            if (hasHeaders)
            {
                string line;
                if ((line = sr.ReadLine()) != null)
                {
                    string[] headers;
                    line = line.RemoveDiacritics();
                    headers = Regex.Replace(line, @"[\%\+\/\*\(\)]+", "").Split(separators);
                    for (int i = 0; i < headers.Length; i++)
                    {
                        headers[i] = Regex.Replace(headers[i], @"[\s]+", "");
                    }

                    string[] commonHeaders = headers.Intersect(this.Columns).ToArray();
                    
                    if (commonHeaders.Count() != this.Columns.Count())
                    {
                        string message = "The number of columns from the file does not match " +
                            "the number of columns in the current network. Fix the file and try again";
                        throw new ColumnsDoNotMatchException(message);
                    }

                    return commonHeaders;
                }
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
            int columnCount = vector.Length;
            for (int i = 0; i < columnCount; i++)
            {
                string header = headers[i];
                string vectorValue = vector[i];
                nullIndeces[header] = new List<int>();
                averages[header] = 0;
                if (String.IsNullOrEmpty(vectorValue) || vectorValue == missingValues)
                {
                    emptyAtrributeCount[header] = 1;
                    nullIndeces[header].Add(0);
                    continue;
                }

                bool isParsable = (double.TryParse(vectorValue.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat) && !header.Contains("ID"));
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

        private void AddDataFromLine(string[] headers, string[] vector, string missingValues)
        {

            if(IdColumnName == null)
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



                if (vectorValue == "" || vectorValue == missingValues)
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
                //keys.MoveNext();
                /*if (this.Data[headers[i]] is List<int>)
                    this.Data[headers[i]].Add(int.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));*/
                string header = headers[i];
                string vectorValue = vector[i];
                bool isParsable = double.TryParse(vectorValue.Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat);

                if (emptyAtrributeCount.ContainsKey(header))
                {

                    if (String.IsNullOrEmpty(vectorValue) || vectorValue == missingValues)
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

                if (vectorValue == "" || vectorValue == missingValues)
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
                }
               
                //Load Data to Frame
                while ((line = sr.ReadLine()) != null)
                {
                        
                    line = line.Trim();
                    if(line == "")
                    {
                        continue;
                    }

                    vector = line.Split(separator);

                    AddDataFromLine(headers, vector, missingvalues, emptyAtrributeCount, nullIndeces, averages);
                        
                    DataCount++;
                }

                    
                    
            }
            
            this.Averages = averages;
            FindAttributeExtremesAndValues();

            /*foreach(var pair in nullIndeces)
            {
                double columnAverage = averages[pair.Key] / DataCount;
                foreach(int index in pair.Value)
                {
                    this.Data[pair.Key].Data[index] = columnAverage;
                }
            }*/


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

                this.Averages = CalculateAverages();
                FindAttributeExtremesAndValues();

            
        }


        /// <summary>
        /// Removes the specified column.
        /// </summary>
        /// <param name="column"></param>
        public void RemoveColumn(string column)
        {
            this.Data.Remove(column);
        }

        public static DataFrame FromD3Json(JArray jNodes, JObject jAttributes)
        {
            DataFrame df = new DataFrame(jAttributes);
            
            foreach (var node in jNodes)
            {
                df.IdColumn.AddData(node["id"].ToString());
                foreach (string column in df.Columns)
                {
                    IColumn columnList = df[column];
                    JToken attributeValue = node[column];
                    object value = attributeValue.ToString() != null ? attributeValue.ToObject<object>() : null;
                    df[column].AddData(value);
                }
                df.DataCount++;
            }

            return df;
            
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
}
