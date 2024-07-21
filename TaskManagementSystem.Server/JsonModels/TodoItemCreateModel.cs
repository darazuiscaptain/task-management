namespace TaskManagementSystem.Server.JsonModels
{
    public class TodoItemCreateModel
    {
        public int OwnerId { get; set; }
        public required string Title { get; set; }
        public required string Description { get; set; }
        public int WorkspaceId { get; set; }
    }
}
