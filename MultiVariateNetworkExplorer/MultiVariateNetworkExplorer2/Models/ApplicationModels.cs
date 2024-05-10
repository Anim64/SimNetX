namespace MultiVariateNetworkExplorer2.Models
{
    public class ApplicationModels
    {
        public InputModel InputModel { get; set; }
        public GraphModel GraphModel { get; set; }

        public ApplicationModels() 
        { 
            this.GraphModel = new GraphModel();
            this.InputModel = new InputModel();
        }

        public ApplicationModels(GraphModel graphModel)
        {
            this.GraphModel = graphModel;
            this.InputModel = new InputModel();
        }
    }
}
