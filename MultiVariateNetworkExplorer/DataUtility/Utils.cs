using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DataUtility
{
    public static class Utils
    {
        public static bool BinarySearch<T>(ICollection<T> collection, T searchedElement)
        {
            int high = collection.Count - 1, low = 0, mid;

            while(low <= high)
            {
                mid = (high + low) / 2;
                int compareResult = Comparer.DefaultInvariant.Compare(searchedElement, collection.ElementAt(mid));
                if (compareResult == 0)
                {
                    return true;
                }

                else if(compareResult < 0)
                {
                    high = mid - 1;
                }

                else
                {
                    low = mid + 1;
                }
            }

            return false;
        }

       

        
    }
}
