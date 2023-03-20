using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;

namespace DataFrameLibrary
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

        public static string RemoveDiacritics(this string text)
        {
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder(capacity: normalizedString.Length);

            for (int i = 0; i < normalizedString.Length; i++)
            {
                char c = normalizedString[i];
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder
                .ToString()
                .Normalize(NormalizationForm.FormC);
        }




    }
}
