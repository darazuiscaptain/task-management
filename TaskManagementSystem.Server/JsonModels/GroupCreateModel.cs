namespace TaskManagementSystem.Server.JsonModels
{
    public class GroupCreateModel
    {
        public int OwnerId { get; set; }
        public required string Name { get; set; }
        public required string Description { get; set; }
    }
}
