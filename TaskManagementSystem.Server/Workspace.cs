namespace TaskManagementSystem.Server
{
    public class Workspace
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public int GroupOwnerId { get; set; }
        public required string Name { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public List<int> TodoItems = new List<int>();
        public List<int> Invitations=new List<int>();
        public int DefaultGroupId { get; set; }

        public bool HasPermission(int uid, WorkspacePermission permission)
        {
            Group group;
            return uid == OwnerId ||
                GroupDatabase.Instance.TryGetGroup(DefaultGroupId, out group) && group.HasUser(uid) && group.GetPermission(uid).HasAll(permission)
                ||
                GroupDatabase.Instance.TryGetGroup(GroupOwnerId, out group) && group.HasUser(uid) && group.GetPermission(uid).HasAll(permission);
                
        }

        public bool HasAnyPermission(int uid, WorkspacePermission permission)
        {
            Group group;
            return uid == OwnerId ||
                GroupDatabase.Instance.TryGetGroup(DefaultGroupId, out group) && group.HasUser(uid) && group.GetPermission(uid).HasAny(permission)
                ||
                GroupDatabase.Instance.TryGetGroup(GroupOwnerId, out group) && group.HasUser(uid) && group.GetPermission(uid).HasAny(permission);

        }
    }

    public enum WorkspacePermission : uint
    {
        None=0,

        View=1,

        ToggleSelf = 1<<1,
        ToggleAssigned = 1<<2,
        Toggle = 1<<3,

        ClaimSelf = 1<<4,
        Claim = 1<<5,

        AssignSelf = 1<<6,
        Assign = 1<<7,

        Create = 1<<8,

        EditSelf = 1<<9,
        EditAssigned = 1<<10,
        Edit = 1<<11,

        ArchiveSelf = 1<<12,
        Archive = 1<<13,

        DeleteSelf = 1<<14,
        Delete = 1<<15,


        WorkspaceInviteCreate = 1 << 20,
        WorkspaceUserManage = 1 << 21,
        WorkspaceRoleManage = 1 << 22,

        WorkspaceViewDeletedItem = 1 << 23,

        GroupWorkspaceManage=1<<26,
        GroupUserManage=1<<27,
        GroupRoleManage = 1 << 28,
    }
    public static class WorkspacePermissionExtension
    {
        public static bool HasAll(this WorkspacePermission This, WorkspacePermission permission)
        {
            return (This & permission) == permission;
        }

        public static bool HasAny(this WorkspacePermission This, WorkspacePermission permission)
        {
            return (This & permission) > 0;
        }

        public static bool HasNone(this WorkspacePermission This, WorkspacePermission permission)
        {
            return (This & permission) == 0;
        }
    }
}
