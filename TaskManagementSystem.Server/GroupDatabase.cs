namespace TaskManagementSystem.Server
{
    public class GroupDatabase
    {
        private static readonly GroupDatabase _instance;
        public static GroupDatabase Instance { get { return _instance; } }

        static GroupDatabase()
        {
            _instance = new GroupDatabase();
        }

        Dictionary<int, Group> groupById = new Dictionary<int, Group>();
        int next_id = 1;

        public bool TryGetGroup(int id, out Group group)
        {
            return groupById.TryGetValue(id, out group);
        }

        public Group AddGroup(int ownerid, string name,string description)
        {
            Group group=new Group() { Id=next_id++, OwnerId=ownerid, Name = name,Description = description};
            groupById.Add(group.Id, group);
            return group;
        }

        public bool RemoveGroup(int id)
        {
            if(groupById.ContainsKey(id))
            {
                Group group = groupById[id];
                if (!group.IsWorkspaceDefaultGroup)
                {
                    foreach (int wid in new List<int>(group.Workspaces))
                    {
                        WorkspaceDatabase.Instance.RemoveWorkspace(wid);
                    }
                    if (UserDatabase.Instance.TryGetUser(group.OwnerId, out User owner))
                    {
                        owner.Groups.Remove(id);
                    }
                    foreach(int uid in group.Members.Keys)
                    {
                        UserDatabase.Instance.TryGetUser(uid, out User user);
                        user.Groups.Remove(id);
                    }
                }
                groupById.Remove(id);
                return true;
            }
            return false;
        }
    }
}
