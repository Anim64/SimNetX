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

        IList Data { get; }
        int DataCount { get; }

        object this[int index]
        {
            get;
        }
        

        void AddData(object value, bool updateExtremes = false);
        ColumnString ToColumnString();



    }
}
