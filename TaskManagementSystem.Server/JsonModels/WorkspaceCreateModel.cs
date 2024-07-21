namespace TaskManagementSystem.Server.JsonModels
{
    public class WorkspaceCreateModel
    {
        public required string Name { get; set; }
        public required string Description { get; set; }
        public int GroupOwnerId { get; set; }
    }
}
