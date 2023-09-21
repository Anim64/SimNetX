using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Metrics.Exceptions
{
    [Serializable]
    public class InputInvalidFormatException : Exception
    {
        public InputInvalidFormatException()
        {

        }

        public InputInvalidFormatException(string message) : base(message)
        {

        }

        public InputInvalidFormatException(string message, Exception inner) : base(message, inner)
        {

        }
    }
}
