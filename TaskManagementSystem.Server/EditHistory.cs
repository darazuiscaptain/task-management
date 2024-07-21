namespace TaskManagementSystem.Server
{
    public class EditHistory
    {
        public long Timestamp { get; set; }
        public int OwnerId { get; set; }
        public EditActions Action { get; set; }
        public string Data { get; set; }

        public EditHistory() {
            Timestamp = (long)(DateTime.Now - DateTime.UnixEpoch).TotalMilliseconds;
            Data = string.Empty;
        }
    }

    public enum EditActions
    {
        None = 0,
        Create,
        NameOrTitle,
        Description,
        Delete,
        CheckTodo,
        UncheckTodo,
        Assign,
        Claim,
        Archive,
    }
}
