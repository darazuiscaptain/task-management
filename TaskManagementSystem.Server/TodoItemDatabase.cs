using Microsoft.IdentityModel.Tokens;

namespace TaskManagementSystem.Server
{
    public class TodoItemDatabase
    {
        private static readonly TodoItemDatabase _instance;
        public static TodoItemDatabase Instance { get { return _instance; } }

        static TodoItemDatabase()
        {
            _instance = new TodoItemDatabase();
        }

        Dictionary<int, TodoItem> items = new Dictionary<int, TodoItem>();
        int next_id = 1;

        public IEnumerable<TodoItem> GetItemsFromWorkspace(Workspace ws, bool includesDeleted)
        {
            List<TodoItem> list = new List<TodoItem>(ws.TodoItems.Count);
            foreach(int id in ws.TodoItems)
            {
                if (items.ContainsKey(id) && (includesDeleted||!items[id].IsDeleted))
                    list.Add(items[id]);
            }
            return list;
        }

        public bool TryGetItem(int id, out TodoItem item)
        {
            return items.TryGetValue(id, out item);
        }

        public bool EditItem(int id, int uid, string title, string description)
        {
            if (items.ContainsKey(id) && !items[id].IsDeleted)
            {
                TodoItem item = items[id];
                if (!item.Title.Equals(title))
                {
                    item.Title = title;
                    item.AddEditHistory(uid, EditActions.NameOrTitle, title);
                }
                if (!item.Description.Equals(description))
                {
                    item.Description = description;
                    item.AddEditHistory(uid, EditActions.Description, description);
                }
                return true;
            }
            return false;
        }

        public bool ToggleItem(int id, int uid)
        {
            if (items.ContainsKey(id) && !items[id].IsDeleted)
            {
                TodoItem item = items[id];
                item.IsCompleted = !item.IsCompleted;
                item.AddEditHistory(uid, item.IsCompleted ? EditActions.CheckTodo : EditActions.UncheckTodo);
                return true;
            }
            return false;
        }

        public bool AssignUserToItem(int id, int uid, int aid)
        {
            if (items.ContainsKey(id) && !items[id].IsDeleted)
            {
                TodoItem item = items[id];
                item.AssigneeId = aid;
                item.AddEditHistory(uid, EditActions.Assign, aid.ToString());
                return true;
            }
            return false;
        }

        public bool ClaimItem(int id, int uid)
        {
            if (items.ContainsKey(id) && !items[id].IsDeleted)
            {
                TodoItem item = items[id];
                item.AssigneeId = uid;
                item.AddEditHistory(uid, EditActions.Claim);
                return true;
            }
            return false;
        }

        public bool ArchiveItem(int id, int uid)
        {
            if (items.ContainsKey(id) && !items[id].IsDeleted)
            {
                TodoItem item = items[id];
                item.IsArchived = true;
                item.AddEditHistory(uid, EditActions.Archive);
                return true;
            }
            return false;
        }

        public bool DeleteItem(int id, int uid)
        {
            if (items.ContainsKey(id) && !items[id].IsDeleted)
            {
                TodoItem item = items[id];
                item.IsDeleted = true;
                item.AddEditHistory(uid, EditActions.Delete);
                return true;
            }
            return false;
        }

        public TodoItem CreateItem(int uid, int workspaceParent,string title, string description)
        {
            TodoItem item = new TodoItem() { Id = next_id,OwnerId=uid,WorkspaceParentId=workspaceParent, Title = title, Description=description };
            item.AddEditHistory(uid, EditActions.Create);
            item.AddEditHistory(uid, EditActions.NameOrTitle, title);
            if(!description.IsNullOrEmpty())
                item.AddEditHistory(uid,EditActions.Description, description);
            items.Add(next_id++, item);
            return item;
        }

        public bool RemoveItem(int id)
        {
            return items.Remove(id);
        }
    }
}

