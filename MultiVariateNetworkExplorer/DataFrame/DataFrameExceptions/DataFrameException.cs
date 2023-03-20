using System;

namespace DataFrameLibrary.DataFrameExceptions
{
    [Serializable]
    public class DataFrameException : Exception
    {
        public DataFrameException()
        {
        }

        public DataFrameException(string message) : base(message)
        {

        }

        public DataFrameException(string message, Exception inner) : base(message, inner)
        {
        }
    }
}
