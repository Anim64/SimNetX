using System;

namespace DataFrameLibrary.DataFrameExceptions
{
    [Serializable]
    public class ColumnsDoNotMatchException : DataFrameException
    {
        public ColumnsDoNotMatchException()
        {
            
        }

        public ColumnsDoNotMatchException(string message) : base(message)
        {

        }

        public ColumnsDoNotMatchException(string message, Exception inner) : base(message, inner)
        {

        }
    }
}
