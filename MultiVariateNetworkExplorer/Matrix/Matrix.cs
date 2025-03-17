namespace Matrix
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


        public T[] GetRow(int row)
        {
            // Return new array.
            T[] res = new T[this.Cols];
            for (int i = 0; i < Cols; i++)
            {
                res[i] = this.matrix[i + row * Rows];
            }
            return res;
        }

    }
}
