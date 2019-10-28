using System;
using System.Collections.Generic;
using System.Text;

namespace DataUtility
{
    public class Matrix<T>
    {
        private T[] matrix;
        public int Rows { get; }
        public int Cols { get; }

        public Matrix(int rows, int cols)
        {
            matrix = new T[rows * cols];
            this.Rows = rows;
            this.Cols = cols;
        }

        public T this[int row, int col]
        {
            get
            {
                return matrix[row * Rows + col];
            }
            set
            {


                matrix[row * Rows + col] = value;
            }
        }

    }
}
