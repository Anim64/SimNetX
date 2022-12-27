using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility
{
    public class ColumnExtremesStruct
    {
        public double Min { get; set; }
        public double Max { get; set; }

        public ColumnExtremesStruct(double min, double max)
        {
            this.Min = min;
            this.Max = max;
        }
    }
}
