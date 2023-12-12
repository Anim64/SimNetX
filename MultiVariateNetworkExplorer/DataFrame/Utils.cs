using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Text.RegularExpressions;

namespace DataFrameLibrary
{
    public static class Utils
    {
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

        public static string RemoveSpecialCharacters(this string text)
        {
            string noSpecialChars = Regex.Replace(text, @"[^0-9a-zA-Z-\s]+", "");
            string noMultipleDashesAndSpaces = Regex.Replace(noSpecialChars, @"\s+", "-");
            string noDashes = Regex.Replace(noMultipleDashesAndSpaces, @"([-])\1+", "-");
            string noDashedAtEnd = Regex.Replace(noDashes, @"-$", "");
            return noDashedAtEnd;
        }

        public static bool IsNotBinary(this double x)
        {
            return x != 0 && x != 1;
        }


    }
}
