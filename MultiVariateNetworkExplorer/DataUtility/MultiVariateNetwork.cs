using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility
{
    public class MultiVariateNetwork
    {
        public DataFrame vectorData { get; set; }
        public Network network { get; set; }

        public MultiVariateNetwork()
        {
            vectorData = new DataFrame();
            network = new Network();
        }

        public MultiVariateNetwork(string fileName)
        {
            //vectorData = new DataFrame(fileName);

            //network = vectorData.CreateNetwork();
        }

    }
}
