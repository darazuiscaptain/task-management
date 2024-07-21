namespace TaskManagementSystem.Server.JsonModels
{
    public class GroupRoleCreateModel
    {
        public required string Name { get; set; }
        public string Description { get; set; } = string.Empty;
        public required List<WorkspacePermission> Permissions { get; set; }
    }
}
