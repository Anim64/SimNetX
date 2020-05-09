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
        public SortedDictionary<string, IList> Data { get; set; }
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

        public Dictionary<string, MinMaxStruct> NumAtrrExtremes { get; set; }
        public Dictionary<string, List<string>> CatAttrValues { get; set; }
        
        public DataFrame()
        {
            Data = new SortedDictionary<string, IList>();
            DataCount = 0;
            
        }

        public DataFrame(string fileName, bool header = false, params char[] separator)
        {
            Data = new SortedDictionary<string, IList>();
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
                foreach(var pair in Data)
                {
                    selectedRows.Data.Add(pair.Key, (IList)Activator.CreateInstance(pair.Value.GetType()));

                    foreach(int row in rows)
                    {
                        selectedRows.Data[pair.Key].Add(this.Data[pair.Key][row]);
                    }

                     
                }
                return selectedRows;
            }
        }

        public IList this[string column]
        {
            get
            {
                return this.Data[column];
            }
        }
        /// <summary>
        /// </summary>
        /// <param name="key"></param>
        /// <returns>Return columns from source DataFrame as a new DataFrame</returns>
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

        public object this[string column, int row]
        {
            get
            {
                return this.Data[column][row];
            }

            set
            {
                try
                {
                    var type = this.Data[column][row].GetType();
                    var convertedValue = Convert.ChangeType(value, type);
                    this.Data[column][row] = convertedValue;
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
        public Network ToNetwork(double radius, int N, IList idColumn)
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
        public Network LRNet(IList idColumn)
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






                resultNet.AddIndirectedEdge(idColumn[i].ToString(), idColumn[potentialNeighbours[1]].ToString(), 1);

                if (k > 0)
                {
                    for(int n = 2; n < k + 1; n++)
                    {

                        
                        resultNet.AddIndirectedEdge(idColumn[i].ToString(), idColumn[potentialNeighbours[n]].ToString(), 1);

                       
                    }

                }

                
            }
            return resultNet;
        }

        public IEnumerable<string> Columns()
        {
            return this.Data.Keys;
        }

        private void FindAttributeExtremesAndValues()
        {
            

            foreach (var column in this.Data)
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
            int dataCount = Data.First().Value.Count;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            for(int i = 0; i < dataCount; i++)
            {
                for(int j = i + 1; j < dataCount; j++)
                {
                    double euclideanDistance = 0;
                    foreach (var pair in this.Data)
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
            int dataCount = Data.First().Value.Count;
            Matrix<double> kernelMatrix = new Matrix<double>(dataCount, dataCount);

            for (int i = 0; i < dataCount; i++)
            {
                for (int j = i + 1; j < dataCount; j++)
                {
                    double euclideanDistance = 0;
                    foreach (var pair in this.Data)
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

                    string[] headers = null;
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
                                        this.Data[headers[i]] = new List<int>();
                                        this.Data[headers[i]].Add(resultInt);

                                    }
                                    else if (double.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat))
                                    {
                                        this.Data[headers[i]] = new List<double>();
                                        this.Data[headers[i]].Add(resultFloat);
                                    }
                                    else
                                    {
                                        this.Data[headers[i]] = new List<string>();
                                        this.Data[headers[i]].Add(vector[i]);

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
                                headers[i] = "Attribute" + (i + 1).ToString();
                            }

                            for (int i = 0; i < headers.Length; i++)
                            {
                                //Check if value is number or string
                                if (int.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out int resultInt))
                                {
                                    this.Data[headers[i]] = new List<int>();
                                    this.Data[headers[i]].Add(resultInt);

                                }
                                else if (double.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out double resultFloat))
                                {
                                    this.Data[headers[i]] = new List<double>();
                                    this.Data[headers[i]].Add(resultFloat);
                                }
                                else
                                {
                                    this.Data[headers[i]] = new List<string>();
                                    this.Data[headers[i]].Add(vector[i]);

                                }

                            }
                        }
                    }

                    DataCount++;

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
                        //var keys = this.Data.Keys.GetEnumerator();
                        

                        for(int i = 0; i < headers.Length; i++)
                        {
                            //keys.MoveNext();
                            if (this.Data[headers[i]] is List<int>)
                                this.Data[headers[i]].Add(int.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));
                            else if (this.Data[headers[i]] is List<double>)
                                this.Data[headers[i]].Add(double.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));
                            else if (this.Data[headers[i]] is List<string>)
                                this.Data[headers[i]].Add(vector[i]);
                            
                        }
                    }
                }
            }
            catch(FileNotFoundException fe)
            {
                Console.WriteLine(fe.Message);
            }
        }

        public void RemoveColumn(string column)
        {
            this.Data.Remove(column);
        }

        


    }
}
