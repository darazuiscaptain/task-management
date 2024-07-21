namespace TaskManagementSystem.Server.JsonModels
{
    public class InvitationCreateModel
    {
        public int OwnerId { get; set; }
        public InvitationType Type { get; set; }
        public int TargetId { get; set; }
        public int TargetRoleId { get; set; }
        public required string Name { get; set; }
    }
}
