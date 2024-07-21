using Microsoft.IdentityModel.Tokens;

namespace TaskManagementSystem.Server
{
    public class TodoItem
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public int AssigneeId { get; set; }
        public int WorkspaceParentId;
        public required string Title { get; set; }
        public required string Description { get; set; }
        public long CreatedTimestamp { get; set; }
        public bool IsCompleted { get; set; }
        public bool IsArchived { get; set; }
        public bool IsDeleted { get; set; }

        public List<EditHistory> EditHistory = new List<EditHistory>();

        public TodoItem()
        {
            AssigneeId = -1;
            WorkspaceParentId = -1;
            CreatedTimestamp = (long)(DateTime.Now - DateTime.UnixEpoch).TotalMilliseconds;
        }

        public void AddEditHistory(int uid, EditActions action, string data = null)
        {
            if(data.IsNullOrEmpty())
            {
                EditHistory.Add(new EditHistory() { OwnerId = uid, Action = action });
            }
            else
            {
                EditHistory.Add(new EditHistory() { OwnerId = uid, Action = action, Data = data });
            }
            
        }
    }
}
