using System;
using System.Collections;
using System.Collections.Generic;

namespace Columns.Types
{
    public class ColumnDouble : IColumn
    {
        public IList Data { get; private set; }

        public int DataCount
        {
            get
            {
                return Data.Count;
            }
        }

        public double? this[int index]
        {
            get
            {
                return (double?)Data[index];
            }

            set
            {
                Data[index] = value;
            }
        }



        public ColumnDouble()
        {
            Data = new List<double?>();
        }
        public ColumnDouble(IList data)
        {
            Data = data;
        }

        public ColumnDouble(int size)
        {
            Data = new List<double?>(size);
        }

        public void AddData(object value)
        {
            if (!IsNumber(value))
            {
                Data.Add(null);
                return;
            }

            Type t = Nullable.GetUnderlyingType(typeof(double?));
            double? doubleValue = value != null ? (double?)Convert.ChangeType(value, t) : null;
            Data.Add(doubleValue);
        }

        private bool IsNumber(object value)
        {
            return value is double
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
            return Data.GetEnumerator();
        }

        public ColumnExtremesStruct FindExtremes()
        {
            double min = double.MaxValue;
            double max = double.MinValue;

            foreach (double value in Data)
            {
                if (value > max)
                {
                    max = value;
                }

                if (value < min)
                {
                    min = value;
                }
            }

            return new ColumnExtremesStruct(min, max);
        }

        public double Sum()
        {
            double result = 0;

            foreach (double? value in Data)
            {
                if (value != null)
                {
                    result += (double)value;
                }
            }

            return result;
        }

        public void Map(Func<double, double> mapFunction)
        {
            for (int i = 0; i < DataCount; i++)
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
            List<double?> logColumn = new List<double?>(DataCount);
            foreach (object columnValue in Data)
            {

                if (columnValue != null)
                {
                    double columnValueNumber = (double)columnValue;
                    if (columnValueNumber <= 0)
                    {
                        return;
                    }

                    logColumn.Add(Math.Log(columnValueNumber));
                }
            }

            Data = logColumn;
        }

        public double Average()
        {
            return Sum() / DataCount;
        }

        public double StandardDeviation(double average = double.NegativeInfinity)
        {
            if (average == double.NegativeInfinity)
            {
                average = Average();
            }

            double squareSum = 0;

            foreach (double? value in Data)
            {
                if (value != null)
                {
                    double differenceFromAverage = (double)value - average;
                    squareSum += differenceFromAverage * differenceFromAverage;
                }
            }

            return Math.Sqrt(squareSum / (DataCount - 1));
        }

        public ColumnString ToColumnString()
        {
            ColumnString result = new ColumnString(this);
            return result;
        }
    }
}

