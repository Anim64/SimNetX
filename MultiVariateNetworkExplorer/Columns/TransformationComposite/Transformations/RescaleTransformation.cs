using Columns.Transforms;
using Columns.Types;
using System;
using System.Collections.Generic;
using System.Text;

namespace Columns.TransformationComposite.Transformations
{
    public class RescaleTransformation : ITransformComponent
    {
        public void ApplyTransformation(ColumnDouble column)
        {
            ColumnExtremesStruct columnExtremes = column.FindExtremes();
            double range = columnExtremes.Max - columnExtremes.Min;
            column.Map((columnValue) => { return (columnValue - columnExtremes.Min) / range; });
            //for (int i = 0; i < column.DataCount; i++)
            //{
            //    double? value = (double?)column[i];
            //    if (value != null)
            //    {
            //        column[i] = ((value - columnExtremes.Min) / range);
            //    }

            //}
        }
    }
}
