namespace TaskManagementSystem.Server
{
    public class WorkspaceDatabase
    {
        private static readonly WorkspaceDatabase _instance;
        public static WorkspaceDatabase Instance { get { return _instance; } }

        static WorkspaceDatabase()
        {
            _instance = new WorkspaceDatabase();
        }

        Dictionary<int, Workspace> workspaceById = new Dictionary<int, Workspace>();
        int next_id = 1;

        public Workspace AddWorkspace(int ownerid, int groupid, string name, string description)
        {
            Workspace ws = new Workspace() { Id = _instance.next_id++, OwnerId = ownerid, GroupOwnerId=groupid, Name = name, Description = description };
            Group group = GroupDatabase.Instance.AddGroup(-1, name, "Default group for the workspace.");
            group.IsWorkspaceDefaultGroup = true;
            group.Workspaces.Add(ws.Id);
            ws.DefaultGroupId = group.Id;
            if(GroupDatabase.Instance.TryGetGroup(groupid,out Group group2))
            {
                group2.Workspaces.Add(ws.Id);
            }
            _instance.workspaceById.Add(ws.Id, ws);
            return ws;
        }

        public bool TryGetWorkspace(int id, out Workspace ws)
        {
            if (workspaceById.ContainsKey(id))
                return (ws = workspaceById[id]) != null;
            ws = null;
            return false;
        }

        public bool EditWorkspace(int id, string name, string description)
        {
            if (workspaceById.ContainsKey(id)&&GroupDatabase.Instance.TryGetGroup(workspaceById[id].DefaultGroupId,out Group group))
            {
                workspaceById[id].Name = name;
                workspaceById[id].Description = description;
                group.Name = name;
                return true;
            }
            return false;
        }

        public bool RemoveWorkspace(int id)
        {
            if (workspaceById.ContainsKey(id))
            {
                Workspace ws= workspaceById[id];
                ws.IsDeleted = true;
                foreach(int tid in ws.TodoItems)
                {
                    TodoItemDatabase.Instance.RemoveItem(tid);
                }
                if (ws.GroupOwnerId > 0 && GroupDatabase.Instance.TryGetGroup(ws.GroupOwnerId, out Group group))
                {
                    group.RemoveWorkspace(id);
                }
                if(GroupDatabase.Instance.TryGetGroup(ws.DefaultGroupId, out Group defaultGroup))
                {
                    defaultGroup.RemoveWorkspace(id);
                    GroupDatabase.Instance.RemoveGroup(ws.DefaultGroupId);
                }
                if(UserDatabase.Instance.TryGetUser(ws.OwnerId, out User user)) {
                    user.WorkspaceOwned.Remove(id);
                }
                workspaceById.Remove(id);
                return true;
            }
            return false;
        }
    }
}
