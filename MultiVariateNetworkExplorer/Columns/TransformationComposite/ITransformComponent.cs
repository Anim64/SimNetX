using Columns.Types;
using System;
using System.Collections.Generic;
using System.Text;

namespace Columns.Transforms
{
    public interface ITransformComponent
    {
        void ApplyTransformation(ColumnDouble column);
    }
}
