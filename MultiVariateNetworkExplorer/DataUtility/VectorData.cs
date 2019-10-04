using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace DataUtility
{
    public class VectorData
    {
        SortedDictionary<string, IList> vectorData;
        public VectorData()
        {
            vectorData = new SortedDictionary<string, IList>();
            
        }

        public List<string> this[int i]
        {
            get
            {
                List<string> returnValue = new List<string>(vectorData.Count);
                foreach( var pair in vectorData)
                {
                    returnValue.Add(pair.Value[i].ToString());
                }
                return returnValue;
            }
        }

        public IList this[string key]
        {
            get
            {
                return this.vectorData[key];
            }
        }

        public object this[string key, int i]
        {
            get
            {
                return this.vectorData[key][i];
            }

            set
            {
                try
                {
                    var type = this.vectorData[key][i].GetType();
                    var convertedValue = Convert.ChangeType(value, type);
                    this.vectorData[key][i] = convertedValue;
                }
                catch(Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }

        


        /// <summary>
        /// Method used to read vector data from a file.
        /// </summary>
        /// <param name="filename"></param>
        /// <param name="header"></param>
        /// <param name="separator"></param>
        public void ReadFromFile(string filename, char separator, bool header = false)
        {
            try
            {
                
                using (StreamReader sr = new StreamReader(filename))
                {
                    
                    string[] vector;
                    if (header)
                    {

                        string[] headers = sr.ReadLine().Trim().Split(separator);
                        vector = sr.ReadLine().Trim().Split(separator);
                        // Create keys based on headers
                        for (int i = 0; i < headers.Length; i++)
                        {
                            //Check if value is number or string
                            if (float.TryParse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture, out float result))
                                this.vectorData[headers[i]] = new List<float>();
                            else
                                this.vectorData[headers[i]] = new List<string>();

                        }
                    }

                    else
                    {
                        vector = sr.ReadLine().Trim().Split(separator);
                        int index = 0;
                        // Create keys with default value
                        foreach (string value in vector)
                        {
                            //Check if value is number or string
                            if (float.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out float result))
                            {
                                this.vectorData["Atr" + index.ToString()] = new List<float>();
                                this.vectorData["Atr" + index.ToString()].Add(result);

                            }

                            else
                            {
                                this.vectorData["Atr" + index.ToString()] = new List<string>();
                                this.vectorData["Atr" + index.ToString()].Add(value);
                            }

                            index++;

                        }

                    }

                    string line;
                    while ((line = sr.ReadLine()) != null)
                    {
                        line = line.Trim();
                        if(line == "")
                        {
                            continue;
                        }

                        vector = line.Split(separator);
                        var keys = this.vectorData.Keys.GetEnumerator();
                        

                        for (int i = 0; i < this.vectorData.Count; i++)
                        {
                            keys.MoveNext();
                            if (this.vectorData[keys.Current] is List<float>)
                                this.vectorData[keys.Current].Add(float.Parse(vector[i], NumberStyles.Any, CultureInfo.InvariantCulture));
                            else if (this.vectorData[keys.Current] is List<string>)
                                this.vectorData[keys.Current].Add(vector[i]);
                            
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
