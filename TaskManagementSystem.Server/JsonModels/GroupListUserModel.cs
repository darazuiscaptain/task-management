namespace TaskManagementSystem.Server.JsonModels
{
    public class GroupListUserModel
    {
        public int OwnerId { get; set; }
        public required Dictionary<int, IEnumerable<int>> Members { get; set; }
        public required Dictionary<int, string> Roles { get; set; }
    }
}
