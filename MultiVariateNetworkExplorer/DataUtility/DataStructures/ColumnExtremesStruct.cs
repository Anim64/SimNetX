using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility
{
    public class ColumnExtremesStruct
    {
        public double MinAttrValue { get; set; }
        public double MaxAttrValue { get; set; }

        public ColumnExtremesStruct(double min, double max)
        {
            this.MinAttrValue = min;
            this.MaxAttrValue = max;
        }
    }
}
