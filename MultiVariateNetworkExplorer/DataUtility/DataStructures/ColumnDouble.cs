using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;

namespace DataUtility
{
    public class ColumnDouble : IColumn
    {
        public IList Data { get; } = new List<double?>();
        public int DataCount
        {
            get
            {
                return this.Data.Count;
            }
        }

        private ColumnExtremesStruct extremes = null;
        public ColumnExtremesStruct Extremes 
        {
            get
            {
                if(this.extremes == null)
                {
                    this.extremes = FindExtremes();
                }

                return this.extremes;


            }
            private set
            {
                this.extremes = value;
            }
        }


        public ColumnDouble()
        {

        }
        public ColumnDouble(IList data)
        {
            this.Data = data;
        }

        public object this[int index]
        {
            get
            {
                return this.Data[index];
            }
        }

        public void AddData(object value, bool updateExtremes = false)
        {
            if(updateExtremes)
            {
                this.Extremes = FindExtremes();
            }

            double? doubleValue = (double?)value;
            this.Data.Add(doubleValue);
        }

        public IEnumerator GetEnumerator()
        {
            return this.Data.GetEnumerator();
        }

        private ColumnExtremesStruct FindExtremes()
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


    }
}

