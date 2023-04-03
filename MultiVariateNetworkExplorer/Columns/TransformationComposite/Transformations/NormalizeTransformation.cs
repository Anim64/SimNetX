using Columns.Transforms;
using Columns.Types;
using System;
using System.Collections.Generic;
using System.Text;

namespace Columns.TransformationComposite.Transformations
{
    public class NormalizeTransformation : ITransformComponent
    {
        public void ApplyTransformation(ColumnDouble column)
        {
            ColumnExtremesStruct columnExtremes = column.FindExtremes();
            column.Map(columnValue => { return columnValue / columnExtremes.Max; });
            //for (int i = 0; i < column.DataCount; i++)
            //{
            //    double? value = (double?)column[i];
            //    if (value != null)
            //    {
            //        column[i] = value / columnExtremes.Max;
            //    }

            //}
        }
    }
}
