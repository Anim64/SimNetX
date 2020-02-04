using DataUtility;
using System;
using System.Collections.Generic;
using System.Diagnostics;

namespace TestApp
{
    class Program
    {
        static void Main(string[] args)
        {
            //DataFrame v = new DataFrame();
            //v.ReadFromFile("iris.data", ',');


            MultiVariateNetwork mvn = new MultiVariateNetwork("iris.data", false , ',');
            string json = mvn.ToD3Json();
            Console.WriteLine(json);
            


            
            
        }
    }
}
