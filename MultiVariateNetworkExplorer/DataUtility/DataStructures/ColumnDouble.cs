using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection.Metadata.Ecma335;
using System.Text;

namespace DataUtility
{
    public class ColumnDouble : IColumn, IEnumerable
    {
        public IList Data { get; private set; } 

        public int DataCount
        {
            get
            {
                return this.Data.Count;
            }
        }

        public object this[int index]
        {
            get
            {
                return this.Data[index];
            }

            set
            {
                this.Data[index] = value;
            }
        }
        


        public ColumnDouble()
        {
            this.Data = new List<double?>();
        }
        public ColumnDouble(IList data)
        {
            this.Data = data;
        }

        public ColumnDouble(int size)
        {
            this.Data = new List<double?>(size);
        }

        public void AddData(object value)
        {
            if (!IsNumber(value))
            {
                this.Data.Add(null);
                return;
            }

            Type t = Nullable.GetUnderlyingType(typeof(double?));
            double? doubleValue = value != null ? (double?)Convert.ChangeType(value, t) : null;
            this.Data.Add(doubleValue);
        }

        private bool IsNumber(object value)
        {
            return  value is double
            || value is int
            || value is sbyte
            || value is byte
            || value is short
            || value is ushort
            || value is uint
            || value is long
            || value is ulong
            || value is float
            || value is decimal;
        }

        public IEnumerator GetEnumerator()
        {
            return this.Data.GetEnumerator();
        }

        public  ColumnExtremesStruct FindExtremes()
        {
            double min = double.MaxValue;
            double max = double.MinValue;

            foreach(double value in this.Data)
            {
                if(value > max)
                {
                    max = value;
                }

                if(value < min)
                {
                    min = value;
                }
            }

            return new ColumnExtremesStruct(min, max);
        }

        public double Sum()
        {
            double result = 0;

            foreach(double? value in this.Data)
            {
                if(value != null)
                {
                    result += (double)value;
                }
            }

            return result;
        }

        public void Map(Func<double, double> mapFunction)
        {
            for (int i = 0; i < this.DataCount; i++)
            {
                object columnValue = this[i];
                if (columnValue != null)
                {
                    this[i] = mapFunction((double)columnValue);
                }
            }
        }

        public void Log()
        {
            List<double?> logColumn = new List<double?>(this.DataCount);
            foreach (object columnValue in this.Data)
            {
                
                if (columnValue != null)
                {
                    double columnValueNumber = (double)columnValue;
                    if(columnValueNumber <= 0)
                    {
                        return;
                    }

                    logColumn.Add(Math.Log(columnValueNumber));
                }
            }

            this.Data = logColumn;
        }

        public double Average()
        {
            return this.Sum() / this.DataCount;
        }

        public double StandardDeviation(double average = double.NegativeInfinity)
        {
            if(average == double.NegativeInfinity)
            {
                average = this.Average();
            }

            double squareSum = 0;

            foreach (double? value in this.Data)
            {
                if (value != null)
                {
                    double differenceFromAverage = ((double)value - average);
                    squareSum += differenceFromAverage * differenceFromAverage;
                }
            }

            return Math.Sqrt(squareSum / (this.DataCount - 1));
        }

        public ColumnString ToColumnString()
        {
            ColumnString result = new ColumnString(this);
            return result;
        }
    }
}

