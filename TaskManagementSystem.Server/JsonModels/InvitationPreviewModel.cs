namespace TaskManagementSystem.Server.JsonModels
{
    public class InvitationPreviewModel
    {
        public InvitationType Type { get; set; }
        public string TargetName { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
    }
}
