namespace TaskManagementSystem.Server
{
    public class User
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public bool IsDeleted { get; set; }
        public List<int> WorkspaceOwned { get; set; } = new List<int>();
        public List<int> WorkspaceJoined { get; set; } = new List<int>();
        public List<int> Invitations { get; set; } = new List<int>();
        public List<int> Groups { get; set; } = new List<int>();
    }
}
