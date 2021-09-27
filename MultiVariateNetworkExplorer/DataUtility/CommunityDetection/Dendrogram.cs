using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DataUtility
{
    /// <summary>
    /// A dendrogram is a tree, and each level is a partition of the graph nodes. Level 0 is the first partition, which contains the smallest communities,
    /// and the largest (best) are in dendrogram.Length - 1.
    /// </summary>
    public class Dendrogram
    {
        private List<Dictionary<string, string>> Partitions;

        /// <summary>
        /// Creates a dendrogram with one level.
        /// </summary>
        /// <param name="part">The partition for the one level.</param>
        public Dendrogram(Dictionary<string, string> part)
        {
            Partitions = new List<Dictionary<string, string>>
            {
                part
            };
        }

        /// <summary>
        /// Creates a dendrogram with multiple levels.
        /// </summary>
        /// <param name="parts"></param>
        public Dendrogram(IEnumerable<Dictionary<string, string>> parts)
        {
            Partitions = new List<Dictionary<string, string>>(parts);
        }

        public int Length { get { return Partitions.Count; } }

        /// <summary>
        /// Return the partition of the nodes at the given level.
        /// </summary>
        /// <param name="level">The level to retrieve, [0..dendrogram.Length-1].</param>
        /// <returns>A dictionary where keys are nodes and values the set to which it belongs.</returns>
        public Dictionary<string, string> PartitionAtLevel(int level)
        {
            Dictionary<string, string> partition = new Dictionary<string, string>(Partitions[0]);
            for (int index = 1; index <= level; index++)
            {
                foreach (string node in partition.Keys.ToArray())
                {
                    string com = partition[node];
                    partition[node] = Partitions[index][com];
                }
            }
            return partition;
        }
    }
}
