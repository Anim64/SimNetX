namespace Columns
{
    public class ColumnExtremesStruct
    {
        public double Min { get; set; }
        public double Max { get; set; }

        public ColumnExtremesStruct(double min, double max)
        {
            Min = min;
            Max = max;
        }
    }
}
