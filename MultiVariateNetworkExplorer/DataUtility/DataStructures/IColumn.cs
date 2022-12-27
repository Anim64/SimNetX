using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;

namespace DataUtility
{
    public interface IColumn
    {
        public enum ColumnTypes
        {
            Double,
            String
        }

        public IList Data { get; }
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
        

        public abstract void AddData(object value);
        public abstract ColumnString ToColumnString();



    }
}
