using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ServerModels
{
    public class AttributeInfoModel
    {
        public string Name { get; set; }
        public string Type { get; set; }

        public AttributeInfoModel(string name, string type)
        {
            this.Name = name;
            this.Type = type;
        }
    }
}
