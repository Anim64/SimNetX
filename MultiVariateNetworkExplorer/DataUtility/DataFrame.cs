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
        private SortedDictionary<string, IList> dataFrame;
        public int DataCount { get; set; }
        public DataFrame()
        {
            dataFrame = new SortedDictionary<string, IList>();
            DataCount = 0;
            
        }

        public DataFrame(string fileName, bool header = false, params char[] separator)
        {
            dataFrame = new SortedDictionary<string, IList>();
            DataCount = 0;
            this.ReadFromFile(fileName, header, separator);
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
        public Network CreateNetwork(double radius, int N)
        {
            Network result = new Network();
            Matrix<double> kernelMatrix = KernelMatrix();

     

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

                    result.AddIndirectedEdge(i.ToString(), pair.Key.ToString());
                    edgeCount++;
                }
            }

            return result;


        }

        private Matrix<double> KernelMatrix()
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
