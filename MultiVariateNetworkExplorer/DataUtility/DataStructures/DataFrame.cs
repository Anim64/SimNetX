using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace DataUtility
{
    public class DataFrame : IEnumerable<KeyValuePair<string, IColumn>>
    {
        /// <summary>
        /// A dataframe that holds vector data
        /// </summary>
        public SortedDictionary<string, IColumn> Data { get; set; }

        /// <summary>
        /// Gets the number of rows in the dataframe.
        /// </summary>
        public int DataCount { get; set; }

        /// <summary>
        /// Contains extremes of numerical attributes.
        /// </summary>
        public Dictionary<string, ColumnExtremesStruct> NumAtrrExtremes { get; set; }

        /// <summary>
        /// Contains distinct values for every categorical column.
        /// </summary>
        public Dictionary<string, List<string>> CatAttrValues { get; set; }
        
        /// <summary>
        /// Creates an empty dataframe.
        /// </summary>
        public DataFrame()
        {
            Data = new SortedDictionary<string, IColumn>();
            DataCount = 0;
            
        }

        /// <summary>
        /// Creates a dataframe and fills it with data form a file.
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="missingvalues"></param>
        /// <param name="header"></param>
        /// <param name="separator"></param>
        public DataFrame(string fileName, string missingvalues, bool header = false, params char[] separator)
        {
            Data = new SortedDictionary<string, IColumn>();
            DataCount = 0;

            NumAtrrExtremes = new Dictionary<string, ColumnExtremesStruct>();
            CatAttrValues = new Dictionary<string, List<string>>();

            this.ReadFromFile(fileName, missingvalues, header, separator);
            
            
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
        /// <summary>
        /// Creates a new network based on Dataframe using epsilon and kNN conversion.
        /// </summary>
        /// <param name="radius">Threshold under which every vertice will create an edge</param>
        /// <param name="N">Number of minimum edges per vertice</param>
        /// <returns>Returns a network representation of the DataFrame as <see cref="Network"/></returns>
        public Network ToNetwork(IColumn idColumn, double radius = 0.5, int N = 1)
        {
            Network result = new Network(this.DataCount);
            Matrix<double> kernelMatrix = GaussKernelMatrix();

           
            for (int i = 0; i < kernelMatrix.Rows; i++)
            {
                Dictionary<int, double> dict = new Dictionary<int, double>();

                for (int j = i; j < kernelMatrix.Cols; j++)
                {
                    if (i != j)
                    {
                        dict[j] = kernelMatrix[i, j];
                    }

                }

                var orderedDict = dict.OrderByDescending(key => key.Value);

                int edgeCount = 0;

                foreach (KeyValuePair<int, double> pair in orderedDict)
                {
                    if (edgeCount >= N && pair.Value < radius)
                        break;

                    result.AddIndirectedEdge(idColumn[i].ToString(), idColumn[pair.Key].ToString(), 1);
                    edgeCount++;
                }
            }

            return result;
        }

        /// <summary>
        /// Creates a new network based on Dataframe using the LRNet algorithm.
        /// 
        /// <para>
        /// References:
        /// Graph construction based on local representativeness, Ochodkova, Eliska and Zehnalova, Sarka and Kudelka, Milos, International Computing and Combinatorics Conference, 2017
        /// </para>
        /// </summary>
        /// <param name="idColumn"></param>
        /// <returns>Returns a network representation of the DataFrame as <see cref="Network"/></returns>
        public Network LRNet(IColumn idColumn)
        {
            Network resultNet = new Network(this.DataCount);
            Matrix<double> kernelMatrix = GaussKernelMatrix();
            Dictionary<int, int> degrees = new Dictionary<int, int>();
            Dictionary<int, int> significances = new Dictionary<int, int>();

            Dictionary<int, double> representativeness = new Dictionary<int, double>();
            Dictionary<int, int> representativeNeighboursCount = new Dictionary<int, int>();

            for(int i = 0; i < kernelMatrix.Rows; i++)
            {
                int nearestNeighbour = -1;
                double maxSimilarity = -1;
                for (int j = 0; j < kernelMatrix.Cols; j++)
                {
                    if (i == j)
                    {
                        continue;
                    }

                    if (!degrees.ContainsKey(i))
                    {
                        degrees[i] = 0;
                        significances[i] = 0;
                    }

                    if (kernelMatrix[i, j] > 0)
                    {
                        
                            degrees[i]++;
                        
                    }

                    if (kernelMatrix[i, j] > maxSimilarity)
                    {
                        maxSimilarity = kernelMatrix[i, j];
                        nearestNeighbour = j;
                    }
                }

                if (!significances.ContainsKey(nearestNeighbour))
                {
                    significances[nearestNeighbour] = 0;
                }

                significances[nearestNeighbour]++;
                

            };

            for (int i = 0; i < kernelMatrix.Rows; i++)
            {
                if (significances[i] > 0)
                {
                    representativeness[i] = 1.0 / (Math.Pow((1 + degrees[i]), (1.0 / significances[i])));
                }

                else
                {
                    representativeness[i] = 0;
                }

                int k = ((int)Math.Round(representativeness[i] * degrees[i]));

                double[] vertexSimilarities = kernelMatrix.GetRow(i);
                List<int> potentialNeighbours = Enumerable.Range(0, this.DataCount).ToList();
                potentialNeighbours = potentialNeighbours.OrderByDescending(kv => vertexSimilarities[kv]).ToList();
                
               

                if (k > 0)
                {
                    for (int n = 0; n < k + 1; n++)
                    {
                        if(i != potentialNeighbours[n])
                        {
                            resultNet.AddIndirectedEdge(idColumn[i].ToString(), idColumn[potentialNeighbours[n]].ToString(), 1);

                        }


                    }

                }

                else
                {
                    for(int n = 0; n < 2; n++)
                    {
                        if (i != potentialNeighbours[n])
                        {
                            resultNet.AddIndirectedEdge(idColumn[i].ToString(), idColumn[potentialNeighbours[n]].ToString(), 1);
                        }
                    }
                }




            };
            return resultNet;
        }

        /// <summary>
        /// Gets all column names
        /// </summary>
        /// <returns>A list of column names</returns>
        public IEnumerable<string> Columns()
        {
            return this.Data.Keys;
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
        /// Computes Eucledian distance between every pair of rows of the Dataframe.
        /// </summary>
        /// <returns>A matrix of all Eucledian distances</returns>
        private Matrix<double> EuclideanKernelMatrix()
        {
            int dataCount = Data.First().Value.Data.Count;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            for(int i = 0; i < dataCount; i++)
            {
                for(int j = i + 1; j < dataCount; j++)
                {
                    double euclideanDistance = 0;
                    foreach (var pair in this.Data)
                    {
                        
                        if(!(pair.Value is ColumnString))
                        {
                            euclideanDistance += pair.Value.Data[i] != null && pair.Value.Data[j] != null ? Math.Pow((double)(Convert.ToDouble(pair.Value.Data[i]) - Convert.ToDouble(pair.Value.Data[j])), 2) : 0;
                        }
                        
                    }

                    kernelMatrix[i, j] = kernelMatrix[j, i] = Math.Sqrt(euclideanDistance);
                }
            }

            return kernelMatrix;
        }

        /// <summary>
        /// Computes Gaussian similarity between every pair of rows of the Dataframe.
        /// </summary>
        /// <param name="sigma"></param>
        /// <returns>A matrix of all Gaussian similarities</returns>
        private Matrix<double> GaussKernelMatrix(double sigma = 1)
        {
            int dataCount = Data.First().Value.DataCount;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            Parallel.For(0, dataCount, i => 
            { 
                for (int j = i; j < dataCount; j++)
                {
                    if (i == j)
                    {
                        kernelMatrix[i, j] = kernelMatrix[j, i] = 1;

                    }
                    else
                    {
                        double euclideanDistance = 0;
                        foreach (var pair in this.Data)
                        {

                            if (!(pair.Value is ColumnString))
                            {
                                euclideanDistance += Math.Pow((double)(Convert.ToDouble(pair.Value.Data[i]) - Convert.ToDouble(pair.Value.Data[j])), 2);
                            }

                        }
                        kernelMatrix[i, j] = kernelMatrix[j, i] = (1.0 / (sigma*Math.Sqrt(2*Math.PI))) * Math.Exp((-euclideanDistance) / (2 * Math.Pow(sigma, 2)));
                    }
                }
            });

            return kernelMatrix;
        }




        /// <summary>
        /// Reads vector data from a file and saves them to Dataframe
        /// </summary>
        /// <param name="filename"></param>
        /// <param name="header"></param>
        /// <param name="separator"></param>
        public void ReadFromFile(string filename, string missingvalues, bool header = false, params char[] separator)
        {
            Dictionary<int, int> emptyAtrributeCount = new Dictionary<int, int>();
            Dictionary<string, List<int>> nullIndeces = new Dictionary<string, List<int>>();
            Dictionary<string, double> averages = new Dictionary<string, double>();
            try
            {
                using (StreamReader sr = new StreamReader(filename))
                {

                    string[] headers = null;
                    string[] vector;
                    string line;

                    if ((line = sr.ReadLine()) != null)
                    { 
                        vector = line.Trim().Split(separator);
                        if (header)
                        {
                            headers = vector;
                            if ((line = sr.ReadLine()) != null)
                            {
                                vector = line.Trim().Split();
                            }
                        }

                        else
                        {
                            headers = new string[vector.Length];
                            for(int j = 0; j < headers.Length; j++)
                            {
                                headers[j] = $"Attr{(j + 1)}";
                            }
               
                        }

                        for (int i = 0; i < headers.Length; i++)
                        {
                            
                            nullIndeces[headers[i]] = new List<int>();
                            averages[headers[i]] = 0;
                            if (String.IsNullOrEmpty(vector[i]))
                            {
                                emptyAtrributeCount[i] = 1;
                                continue;
                            }

                            if (double.TryParse(vector[i].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat) && !headers[i].Contains("ID"))
                            {
                                this.Data[headers[i]] = new ColumnDouble();
                                this.Data[headers[i]].AddData(resultFloat);
                                averages[headers[i]] += resultFloat;

                            }
                            else
                            {
                                this.Data[headers[i]] = new ColumnString();
                                this.Data[headers[i]].AddData(vector[i]);

                            }

                        }


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
                        //var keys = this.Data.Keys.GetEnumerator();
                        

                        for(int i = 0; i < headers.Length; i++)
                        {
                            //keys.MoveNext();
                            /*if (this.Data[headers[i]] is List<int>)
                                this.Data[headers[i]].Add(int.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));*/

                            if (emptyAtrributeCount.ContainsKey(i)) {

                                if (!String.IsNullOrEmpty(vector[i]))
                                {
                                    if (double.TryParse(vector[i].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultValue))
                                    {
                                        this.Data[headers[i]] = new ColumnDouble();

                                    }
                                    else
                                    {
                                        this.Data[headers[i]] = new ColumnString();
                                    }

                                    for (int j = 0; j < emptyAtrributeCount[i]; j++)
                                    {
                                        nullIndeces[headers[i]].Add(j);
                                        this.Data[headers[i]].AddData(null);
                                    }

                                    emptyAtrributeCount.Remove(i);

                                }

                                else
                                {
                                    emptyAtrributeCount[i]++;
                                    continue;
                                }

                            }

                            /*if(vector[i].Equals(missingvalues))
                            {
                                this.Data[headers[i]].Add(null);
                                continue;
                            }*/
                            
                            
                            if(double.TryParse(vector[i].Replace(',', '.'), NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat))
                            {
                                this.Data[headers[i]].AddData(resultFloat);
                                averages[headers[i]] += resultFloat;

                            }

                            else if(vector[i] == "" || vector[i] == missingvalues)
                            {
                                nullIndeces[headers[i]].Add(DataCount);
                                this.Data[headers[i]].AddData(null);
                            }
                            
                            else
                            {
                                this.Data[headers[i]].AddData(vector[i]);
                            }

                        }

                        DataCount++;
                    }
                }
            }
            catch(FileNotFoundException fe)
            {
                Console.WriteLine(fe.Message);
            }

            foreach(var pair in nullIndeces)
            {
                double columnAverage = averages[pair.Key] / DataCount;
                foreach(int index in pair.Value)
                {
                    this.Data[pair.Key].Data[index] = columnAverage;
                }
            }


        }


        /// <summary>
        /// Removes the specified column.
        /// </summary>
        /// <param name="column"></param>
        public void RemoveColumn(string column)
        {
            this.Data.Remove(column);
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
