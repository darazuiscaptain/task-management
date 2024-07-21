namespace TaskManagementSystem.Server.JsonModels
{
    public class UserSignupModel
    {
        public required string UserName { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}
