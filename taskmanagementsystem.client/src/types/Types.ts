interface Workspace {
    id: number;
    ownerId: number;
    groupOwnerId: number;
    name: string;
    description: string;
    isDeleted: boolean;
    defaultGroupId: number;
}

interface TodoItem {
    id: number,
    ownerId: number,
    assigneeId: number,
    title: string,
    description: string,
    createdTimestamp: number,
    isCompleted: boolean,
    isArchived: boolean,
    isDeleted: boolean,
}

interface EditHistory {
    timestamp: number,
    ownerId: number,
    action: EditActions,
    data: string,
}

enum EditActions {
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

interface UserList {
    ownerId: number,
    members: Record<string, Array<number>>,
    roles: Record<string, string>
}

interface WorkspaceList {
    owned: Array<number>,
    joined: Array<number>,
}

class Group {
    id: number;
    ownerId: number;
    name: string;
    description: string;
    isWorkspaceDefaultGroup: boolean;
    workspaces: Array<number>;
    roles: Array<GroupRole>;
    defaultRole: GroupRole;
}

class GroupRole {
    id: number;
    name: string;
    description: string;
    permission: number;
}

enum Permission {
    None = 0,
    View = 1,
    ToggleSelf = 1 << 1,
    ToggleAssigned = 1 << 2,
    Toggle = 1 << 3,
    ClaimSelf = 1 << 4,
    Claim = 1 << 5,
    AssignSelf = 1 << 6,
    Assign = 1 << 7,
    Create = 1 << 8,
    EditSelf = 1 << 9,
    EditAssigned = 1 << 10,
    Edit = 1 << 11,
    ArchiveSelf = 1 << 12,
    Archive = 1 << 13,
    DeleteSelf = 1 << 14,
    Delete = 1 << 15,
    WorkspaceInviteCreate = 1 << 20,
    WorkspaceUserManage = 1 << 21,
    WorkspaceRoleManage = 1 << 22,
    WorkspaceViewDeletedItem = 1 << 23,
    GroupWorkspaceManage = 1 << 26,
    GroupUserManage = 1 << 27,
    GroupRoleManage = 1 << 28,
}

function translatePermission(ps: string): string {
    const permission_dict = {
        'View': 'View',
        'ToggleSelf': 'Toggle (created tasks)',
        'ToggleAssigned': 'Toggle (assigned tasks)',
        'Toggle': 'Toggle (any tasks)',
        'ClaimSelf': 'Claim (created tasks)',
        'Claim': 'Claim (any tasks)',
        'AssignSelf': 'Assign users (created tasks)',
        'Assign': 'Assign users (any tasks)',
        'Create': 'Create tasks',
        'EditSelf': 'Edit (created tasks)',
        'EditAssigned': 'Edit (assigned tasks)',
        'Edit': 'Edit (any tasks)',
        'ArchiveSelf': 'Archive (created tasks)',
        'Archive': 'Archive (any tasks)',
        'DeleteSelf': 'Delete (created tasks)',
        'Delete': 'Delete (any tasks)',
        'WorkspaceInviteCreate': 'Invite users to workspace',
        'WorkspaceUserManage': 'Manage users in workspace',
        'WorkspaceRoleManage': 'Manage roles in workspace',
        'WorkspaceViewDeletedItem': 'View deleted tasks',
        'GroupWorkspaceManage': 'Manage workspaces in group',
        'GroupUserManage': 'Manage users in group',
        'GroupRoleManage': 'Manage roles in group'
    }
    return permission_dict[ps];
}

function hasAllPermission(p0: Permission, p: Permission): boolean {
    return (p0 & p) == p;
}
function hasAnyPermission(p0: Permission, p: Permission): boolean {
    return (p0 & p) != 0;
}
function hasNonePermission(p0: Permission, p: Permission): boolean {
    return (p0 & p) == 0;
}

function parsePermission(p: string | number):Permission {
    if ((typeof p) === "number")
        return p as Permission;
    if (p === undefined || p === null)
        return Permission.None;
    return Permission[p as keyof typeof Permission];
}

interface InviteCreateModel {
    name:string,
    ownerId:number,
    type:'Workspace'|'Group',
    targetId:number,
    targetRoleId:number
}

export {TodoItem,EditActions,EditHistory,Workspace,UserList,WorkspaceList, Group,GroupRole,Permission,hasAllPermission,hasAnyPermission,hasNonePermission,translatePermission,parsePermission,InviteCreateModel}