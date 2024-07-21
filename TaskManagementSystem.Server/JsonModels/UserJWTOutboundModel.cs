namespace TaskManagementSystem.Server.JsonModels
{
    public class UserJWTOutboundModel
    {
        public int Id { get; set; }
        public required string Jwt { get; set; }
    }
}
