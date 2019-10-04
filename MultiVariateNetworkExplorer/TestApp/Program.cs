using DataUtility;
using System;

namespace TestApp
{
    class Program
    {
        static void Main(string[] args)
        {
            VectorData v = new VectorData();
            v.ReadFromFile("iris.data", ',');
            
        }
    }
}
