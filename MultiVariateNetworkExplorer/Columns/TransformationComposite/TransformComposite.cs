using Columns.Types;
using System;
using System.Collections.Generic;
using System.Text;

namespace Columns.Transforms
{
    public class TransformComposite : ITransformComponent
    {
        public List<ITransformComponent> Components { get; } = new List<ITransformComponent>();

        public void Add(ITransformComponent component)
        {
            Components.Add(component);
        }

        public void Remove(int index)
        {
            Components.RemoveAt(index);
        }

        public void ApplyTransformation(ColumnDouble column)
        {
            foreach (ITransformComponent component in this.Components)
            {
                component.ApplyTransformation(column);
            }
        }

    }
}
