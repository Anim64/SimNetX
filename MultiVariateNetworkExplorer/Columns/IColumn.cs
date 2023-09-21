using System.Collections;
using Columns.Types;

namespace Columns
{
    public interface IColumn : IEnumerable
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


        public abstract void AddData(object value);
        public abstract ColumnString ToColumnString();



    }
}
