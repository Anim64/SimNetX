using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility.DataStructures.DataFrameExceptions
{
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
