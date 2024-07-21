namespace TaskManagementSystem.Server.JsonModels
{
    public class WorkspaceListModel
    {
        public required List<int> Owned { get; set; }
        public required List<int> Joined { get; set; }
    }
}
