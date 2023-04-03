using Columns.Transforms;
using Columns.Types;
using System;
using System.Collections.Generic;
using System.Text;

namespace Columns.TransformationComposite.Transformations
{
    public class StandardizeTransformation : ITransformComponent
    {
        public void ApplyTransformation(ColumnDouble column)
        {
            double average = column.Average();
            double stdDev = column.StandardDeviation(average);
            column.Map(columnValue => { return (columnValue - average) / stdDev; });

            //for (int i = 0; i < column.DataCount; i++)
            //{
            //    double? columnValue = (double?)column[i];
            //    column[i] = columnValue != null ? (columnValue - average) / stdDev : null;

            //}
        }

    }
}
