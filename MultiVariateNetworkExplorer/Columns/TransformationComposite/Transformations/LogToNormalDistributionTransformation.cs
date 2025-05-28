using Columns.Transforms;
using Columns.Types;
using System;
using System.Collections.Generic;
using System.Text;

namespace Columns.TransformationComposite.Transformations
{
    public class LogToNormalDistributionTransformation : ITransformComponent
    {
        public void ApplyTransformation(ColumnDouble column)
        {
            column.Map(columnValue => { return Math.Log(Math.Abs(columnValue) + 1); });
        }
    }
}
