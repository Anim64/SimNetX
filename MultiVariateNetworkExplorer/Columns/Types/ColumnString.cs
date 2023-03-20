using System.Collections;
using System.Collections.Generic;

namespace Columns.Types
{
    public class ColumnString : IColumn, IEnumerable
    {
        public IList Data { get; private set; } = new List<string>();

        public int DataCount
        {
            get
            {
                return Data.Count;
            }
        }

        public object this[int index]
        {
            get
            {
                return Data[index];
            }

            set
            {
                Data[index] = value;
            }
        }

        public ColumnString() { }

        public ColumnString(IList data)
        {
            Data = data;
        }

        public ColumnString(int count)
        {
            Data = new List<string>(count);
            for (int i = 0; i < count; i++)
            {
                Data.Add(null);
            }

        }

        public ColumnString(ColumnDouble col)
        {
            Data = new List<string>(col.DataCount);
            foreach (var data in col)
            {
                Data.Add(data.ToString());
            }
        }
        public void AddData(object value)
        {
            string stringValue = value != null ? value.ToString() : null;
            Data.Add(stringValue);
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
