using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DataUtility
{
    public static class Utils
    {
        public static bool BinarySearch<T>(ICollection<T> collection, T searchedElement, Comparer<T> comparer)
        {
            int high = collection.Count - 1, low = 0, mid;

            while(low <= high)
            {
                mid = (high + low) / 2;
                int compareResult = comparer.Compare(searchedElement, collection.ElementAt(mid));
                if (compareResult == 0)
                {
                    return true;
                }

                else if(compareResult < 0)
                {
                    low = mid + 1;
                }

                else
                {
                    high = mid - 1;
                }
            }

            return false;
        }

        
    }
}
