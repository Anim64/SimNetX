using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility.DataStructures.DataFrameExceptions
{
    [Serializable]
    public class EmptyFileException : Exception
    {

        public EmptyFileException()
        {

        }

        public EmptyFileException(string message) : base(message)
        {

        }

        public EmptyFileException(string message, Exception inner) : base(message, inner)
        {

        }
    }
}
