namespace TaskManagementSystem.Server
{
    public class Invitation
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }

        public InvitationType Type { get; set; }
        
        public int TargetId { get; set; }
        public int TargetRoleId { get; set; }

        public required string Name { get; set; }
        public long CreatedTimestamp { get; set; }
        public bool IsPaused { get; set; }
        public bool IsDeleted { get; set; }
        public int Clicks {  get; set; }
        public int Joins { get; set; }
        public bool HasJoinLimit { get; set; }
        public int JoinLimit { get; set;}
        public long Token { get; set; }

        public Invitation()
        {
            CreatedTimestamp = (long)(DateTime.Now - DateTime.UnixEpoch).TotalMilliseconds;
            Token = CreatedTimestamp;
        }
    }

    public enum InvitationType
    {
        Workspace,
        Group,
    }
}
