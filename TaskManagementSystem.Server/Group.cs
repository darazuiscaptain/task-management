namespace TaskManagementSystem.Server
{
    public class Group
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsWorkspaceDefaultGroup { get; set; } = false;
        public List<int> Workspaces { get; set; } = new List<int>();
        public Dictionary<int, GroupRole> Members = new Dictionary<int, GroupRole>();
        public List<GroupRole> Roles { get; set; } = new List<GroupRole>();
        public GroupRole DefaultRole { get; set; } = new GroupRole()
        {
            Id = 0,
            Name = "No Roles",
            Permission = WorkspacePermission.View
        };

        private int next_roleid = 1;
        public GroupRole AddRole(string name,string description,WorkspacePermission permission)
        {
            GroupRole role = new GroupRole() { Id = next_roleid++, Name = name, Description = description, Permission = permission };
            Roles.Add(role);
            return role;
        }
        public bool EditRole(int rid,string name, string description, WorkspacePermission permission)
        {
            GroupRole role = rid == 0 ? DefaultRole : Roles.Find(r => r.Id == rid);
            if (role == null)
                return false;
            role.Name=name;
            role.Description=description;
            role.Permission=permission;
            return true;
        }
        public bool DeleteRole(int rid)
        {
            return Roles.RemoveAll(r => r.Id == rid) > 0;
        }
        public IEnumerable<int> GetRoleMembers(int rid)
        {
            return (from kv in Members where kv.Value.Id == rid select kv.Key);
        }
        public Dictionary<int,IEnumerable<int>> GetMembers()
        {
            Dictionary<int,IEnumerable<int>> result= new Dictionary<int,IEnumerable<int>>();
            result.Add(0,GetRoleMembers(0));
            foreach(GroupRole role in Roles)
                result.Add(role.Id,GetRoleMembers(role.Id));
            return result;
        }

        public void AddUser(int uid,int roleid)
        {
            if (Members.ContainsKey(uid))
                return;
            Members.Add(uid, Roles.Find(r => r.Id == roleid) ?? DefaultRole);
        }

        public void RemoveUser(int uid)
        {
            Members.Remove(uid);
        }

        public void ChangeUserRole(int uid,int roleid)
        {
            Members[uid] = Roles.Find(r => r.Id == roleid) ?? DefaultRole;
        }

        public bool HasUser(int uid)
        {
            return uid==OwnerId||Members.ContainsKey(uid);
        }

        public bool HasViewAccess(int uid, int wid=0)
        {
            return IsWorkspaceDefaultGroup && Workspaces.Contains(wid) || uid == OwnerId || Members.ContainsKey(uid);
        }

        public bool HasRoleManagementAccess(int uid, int wid = 0)
        {
            return IsWorkspaceDefaultGroup && Workspaces.Contains(wid) && WorkspaceDatabase.Instance.TryGetWorkspace(wid, out Workspace ws) && ws.HasPermission(uid, WorkspacePermission.WorkspaceRoleManage)
                || uid == OwnerId || Members.ContainsKey(uid) && Members[uid].Permission.HasAll(WorkspacePermission.GroupRoleManage);
        }

        public bool HasUserManagementAccess(int uid, int wid = 0)
        {
            return IsWorkspaceDefaultGroup && Workspaces.Contains(wid) && WorkspaceDatabase.Instance.TryGetWorkspace(wid, out Workspace ws) && ws.HasPermission(uid, WorkspacePermission.WorkspaceUserManage)
                || uid == OwnerId || Members.ContainsKey(uid) && Members[uid].Permission.HasAll(WorkspacePermission.GroupUserManage);
        }

        public WorkspacePermission GetPermission(int uid)
        {
            return uid==OwnerId? (WorkspacePermission)~0u:Members.ContainsKey(uid) ? Members[uid].Permission : WorkspacePermission.None;
        }

        public void RemoveWorkspace(int wid)
        {
            Workspaces.Remove(wid);
            foreach (int uid in Members.Keys)
            {
                if (UserDatabase.Instance.TryGetUser(uid, out User user))
                {
                    user.WorkspaceJoined.Remove(wid);
                }
            }
        }
    }

    public class GroupRole
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public WorkspacePermission Permission { get; set; }
    }
}
