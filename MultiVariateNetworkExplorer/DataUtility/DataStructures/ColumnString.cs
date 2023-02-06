using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using System.Linq;
using DataUtility.DataStructures.DataFrameExceptions;

namespace DataUtility
{
    public class ColumnString : IColumn, IEnumerable
    {
        public IList Data { get; private set; } = new List<string>();

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

        public ColumnString() { }
        
        public ColumnString(IList data)
        {
            this.Data = data;
        }

        public ColumnString(int count)
        {
            this.Data = new List<string>(count);
            for(int i = 0; i < count; i++)
            {
                this.Data.Add(null);
            }
            
        }

        public ColumnString(ColumnDouble col)
        {
            this.Data = new List<string>(col.DataCount);
            foreach (var data in col)
            {
                this.Data.Add(data.ToString());
            }
        }
        public void AddData(object value)
        {
            string stringValue = value != null ? value.ToString() : null;
            this.Data.Add(stringValue);
        }

        public IEnumerator GetEnumerator()
        {
            return Data.GetEnumerator();
        }

        public ColumnString ToColumnString()
        {
            return this;
        }
    }
}
