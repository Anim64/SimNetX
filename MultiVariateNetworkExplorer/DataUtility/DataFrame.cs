using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace DataUtility
{
    public class DataFrame
    {
        private readonly SortedDictionary<string, IList> dataFrame;
        public int DataCount { get; set; }

        public class MinMaxStruct{
            public double minAttrValue { get; set; }
            public double maxAttrValue { get; set; }

            public MinMaxStruct(double min, double max)
            {
                this.minAttrValue = min;
                this.maxAttrValue = max;
            }
        }

        public Dictionary<string, MinMaxStruct> NumAtrrExtremes { get; }
        public Dictionary<string, List<string>> CatAttrValues { get; }
        
        public DataFrame()
        {
            dataFrame = new SortedDictionary<string, IList>();
            DataCount = 0;
            
        }

        public DataFrame(string fileName, bool header = false, params char[] separator)
        {
            dataFrame = new SortedDictionary<string, IList>();
            DataCount = 0;

            NumAtrrExtremes = new Dictionary<string, MinMaxStruct>();
            CatAttrValues = new Dictionary<string, List<string>>();

            this.ReadFromFile(fileName, header, separator);
            this.FindAttributeExtremesAndValues();
            
        }

        

        /// <summary>
        /// </summary>
        /// <param name="i"></param>
        /// <returns>Return a single line from source DataFrame as a new DataFrame</returns>
        public DataFrame this[params int[] rows]
        {
            get
            {
                DataFrame selectedRows = new DataFrame();
                foreach(var pair in dataFrame)
                {
                    selectedRows.dataFrame.Add(pair.Key, (IList)Activator.CreateInstance(pair.Value.GetType()));

                    foreach(int row in rows)
                    {
                        selectedRows.dataFrame[pair.Key].Add(this.dataFrame[pair.Key][row]);
                    }

                     
                }
                return selectedRows;
            }
        }

        /// <summary>
        /// </summary>
        /// <param name="key"></param>
        /// <returns>Return columns from source DataFrame as a new DataFrame</returns>
        public DataFrame this[params string[] columns]
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

        }

        public object this[string column, int row]
        {
            get
            {
                return this.dataFrame[column][row];
            }

            set
            {
                try
                {
                    var type = this.dataFrame[column][row].GetType();
                    var convertedValue = Convert.ChangeType(value, type);
                    this.dataFrame[column][row] = convertedValue;
                }
                catch(Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="radius">Threshold under which every vertice will create an edge</param>
        /// <param name="N">Number of minimum edges per vertice</param>
        /// <returns>Returns a network representation of the DataFrame</returns>
        public Network ToNetwork(double radius, int N)
        {
            Network result = new Network(this.DataCount);
            Matrix<double> kernelMatrix = EuclideanKernelMatrix();

     

            for (int i = 0; i < kernelMatrix.Rows; i++)
            {
                Dictionary<int, double> dict = new Dictionary<int, double>();

                for (int j = 0; j < kernelMatrix.Cols; j++)
                {
                    if (i != j)
                    {
                        dict[j] = kernelMatrix[i, j];
                    }

                }

                var orderedDict = dict.OrderBy(key => key.Value);

                int edgeCount = 0;

                foreach (KeyValuePair<int, double> pair in orderedDict)
                {
                    if (edgeCount >= N && pair.Value >= radius)
                        break;

                    result.AddIndirectedEdge(i.ToString(), pair.Key.ToString(), 1);
                    edgeCount++;
                }
            }

            return result;
        }
        public Network LRNet()
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
                    if(i == j)
                    {
                        continue;
                    }
                     
                    if(!degrees.ContainsKey(i))
                    {
                        degrees[i] = 0;
                        significances[i] = 0;
                    }

                    if(kernelMatrix[i,j] > 0)
                    {
                        degrees[i]++;
                    }

                    if(kernelMatrix[i,j] > maxSimilarity)
                    {
                        maxSimilarity = kernelMatrix[i, j];
                        nearestNeighbour = j;
                    }
                }

                if(!significances.ContainsKey(nearestNeighbour))
                {
                    significances[nearestNeighbour] = 0;
                }

                significances[nearestNeighbour]++;


            }

            for(int i = 0; i < kernelMatrix.Rows; i++)
            {
                if(significances[i] > 0)
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

                if(k > 0)
                {
                    for(int n = 1; n < k + 1; n++)
                    {
                        resultNet.AddIndirectedEdge(i.ToString(), potentialNeighbours[n].ToString(), 1);
                    }

                }

                else
                {
                    resultNet.AddIndirectedEdge(i.ToString(), potentialNeighbours[1].ToString(), 1);
                } 
            }
            return resultNet;
        }

        public IEnumerable<string> Columns()
        {
            return this.dataFrame.Keys;
        }

        private void FindAttributeExtremesAndValues()
        {
            

            foreach (var column in this.dataFrame)
            {
                if (column.Value is List<int> || column.Value is List<double>)
                {
                    double min = double.PositiveInfinity;
                    double max = double.NegativeInfinity;
                
                    foreach (var value in column.Value)
                    {
                        double dValue = Convert.ToDouble(value);

                        if (dValue > max)
                            max = dValue;

                        if (dValue < min)
                            min = dValue;
                    }

                    this.NumAtrrExtremes[column.Key] = new MinMaxStruct(min, max);
                }

                else if (column.Value is List<string>)
                {
                    this.CatAttrValues[column.Key] = ((List<string>)column.Value).Distinct().ToList();
                }

                
                



            }

        }

        private Matrix<double> EuclideanKernelMatrix()
        {
            int dataCount = dataFrame.First().Value.Count;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            for(int i = 0; i < dataCount; i++)
            {
                for(int j = i + 1; j < dataCount; j++)
                {
                    double euclideanDistance = 0;
                    foreach (var pair in this.dataFrame)
                    {
                        
                        if(!(pair.Value is List<string>))
                        {
                            euclideanDistance += Math.Pow((double)(Convert.ToDouble(pair.Value[i]) - Convert.ToDouble(pair.Value[j])), 2);
                        }
                        
                    }

                    kernelMatrix[i, j] = kernelMatrix[j, i] = Math.Sqrt(euclideanDistance);
                }
            }

            return kernelMatrix;
        }

        private Matrix<double> GaussKernelMatrix(double sigma = 1)
        {
            int dataCount = dataFrame.First().Value.Count;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            for (int i = 0; i < dataCount; i++)
            {
                for (int j = i + 1; j < dataCount; j++)
                {
                    double euclideanDistance = 0;
                    foreach (var pair in this.dataFrame)
                    {

                        if (!(pair.Value is List<string>))
                        {
                            euclideanDistance += Math.Pow((double)(Convert.ToDouble(pair.Value[i]) - Convert.ToDouble(pair.Value[j])), 2);
                        }

                    }
                    kernelMatrix[i, i] = 1; 
                    kernelMatrix[i, j] = kernelMatrix[j, i] = Math.Exp(-(Math.Pow(euclideanDistance, 2) / (2 * Math.Pow(sigma,2))));
                }
            }

            return kernelMatrix;
        }




        /// <summary>
        /// Method used to read vector data from a file.
        /// </summary>
        /// <param name="filename"></param>
        /// <param name="header"></param>
        /// <param name="separator"></param>
        public void ReadFromFile(string filename, bool header = false, params char[] separator)
        {
            try
            {
                
                using (StreamReader sr = new StreamReader(filename))
                {

                    string[] headers;
                    string[] vector;
                    string line;
                    //Load headers
                    if (header)
                    {
                        if((line = sr.ReadLine()) != null)
                        {
                            headers = line.Trim().Split(separator);

                            if ((line = sr.ReadLine()) != null)
                            {
                                vector = line.Trim().Split(separator);

                                for (int i = 0; i < headers.Length; i++)
                                {
                                    //Check if value is number or string
                                    if (int.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out int resultInt))
                                    {
                                        this.dataFrame[headers[i]] = new List<int>();
                                        this.dataFrame[headers[i]].Add(resultInt);

                                    }
                                    else if (double.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat))
                                    {
                                        this.dataFrame[headers[i]] = new List<double>();
                                        this.dataFrame[headers[i]].Add(resultFloat);
                                    }
                                    else
                                    {
                                        this.dataFrame[headers[i]] = new List<string>();
                                        this.dataFrame[headers[i]].Add(vector[i]);

                                    }

                                }
                            }


                        }

                       
                    }

                    //Load default headers
                    else
                    {
                        if ((line = sr.ReadLine()) != null)
                        {
                            vector = line.Trim().Split(separator);
                            headers = new string[vector.Length];
                            for (int i = 0; i < vector.Length; i++)
                            {
                                headers[i] = i.ToString();
                            }

                            for (int i = 0; i < headers.Length; i++)
                            {
                                //Check if value is number or string
                                if (int.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out int resultInt))
                                {
                                    this.dataFrame[headers[i]] = new List<int>();
                                    this.dataFrame[headers[i]].Add(resultInt);

                                }
                                else if (double.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat))
                                {
                                    this.dataFrame[headers[i]] = new List<double>();
                                    this.dataFrame[headers[i]].Add(resultFloat);
                                }
                                else
                                {
                                    this.dataFrame[headers[i]] = new List<string>();
                                    this.dataFrame[headers[i]].Add(vector[i]);

                                }

                            }
                        }
                    }

                    //Load Data to Frame
                    while ((line = sr.ReadLine()) != null)
                    {
                        DataCount++;
                        line = line.Trim();
                        if(line == "")
                        {
                            continue;
                        }

                        vector = line.Split(separator);
                        var keys = this.dataFrame.Keys.GetEnumerator();
                        

                        for (int i = 0; i < this.dataFrame.Count; i++)
                        {
                            keys.MoveNext();
                            if (this.dataFrame[keys.Current] is List<int>)
                                this.dataFrame[keys.Current].Add(int.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));
                            else if (this.dataFrame[keys.Current] is List<double>)
                                this.dataFrame[keys.Current].Add(double.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));
                            else if (this.dataFrame[keys.Current] is List<string>)
                                this.dataFrame[keys.Current].Add(vector[i]);
                            
                        }
                    }
                }
            }
            catch(FileNotFoundException fe)
            {
                Console.WriteLine(fe.Message);
            }
        }

        


    }
}
