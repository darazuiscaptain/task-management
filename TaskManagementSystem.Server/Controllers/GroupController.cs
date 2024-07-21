using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagementSystem.Server.JsonModels;

namespace TaskManagementSystem.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class GroupController : ControllerBase
    {
        // POST: api/group/create
        [HttpPost("create")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult CreateGroup([FromBody] GroupCreateModel form)
        {
            if (!Authorization.TryGetAuthorizedUser(form.OwnerId, HttpContext, out User user))
                return Unauthorized();
            Group group=GroupDatabase.Instance.AddGroup(form.OwnerId,form.Name,form.Description);
            user.Groups.Add(group.Id);
            return Ok(group.Id);
        }

        // GET: api/group/5?wid=1
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetGroup(int id, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasViewAccess(user.Id, wid))
                return Unauthorized();
            return Ok(group);
        }

        // DELETE: api/group/5
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult DeleteGroup(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (group.IsWorkspaceDefaultGroup||group.OwnerId!=user.Id)
                return Unauthorized();
            GroupDatabase.Instance.RemoveGroup(id);
            return Ok();
        }

        // GET: api/group/5/workspaces
        [HttpGet("{id}/workspaces")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetWorkspaceList(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasViewAccess(user.Id))
                return Unauthorized();
            Dictionary<int, string> dict = new Dictionary<int, string>();
            group.Workspaces.ForEach(i => { if (WorkspaceDatabase.Instance.TryGetWorkspace(i, out var ws)) dict.Add(i, ws.Name); });
            return Ok(dict);
        }

        // POST: api/group/5/edit
        [HttpPost("{id}/edit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult EditGroup(int id, [FromBody] GroupEditModel form)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (group.OwnerId!=id||group.IsWorkspaceDefaultGroup)
                return Unauthorized();
            group.Name = form.Name;
            group.Description = form.Description;
            return Ok();
        }

        // POST: api/group/5/role/create?wid=1
        [HttpPost("{id}/role/create")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult CreateRole(int id, [FromBody] GroupRoleCreateModel form, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasRoleManagementAccess(user.Id, wid))
                return Unauthorized();
            WorkspacePermission permission = WorkspacePermission.View;
            foreach (WorkspacePermission perm in form.Permissions)
                permission |= perm;
            GroupRole role=group.AddRole(form.Name, form.Description, permission);
            return Ok(role.Id);
        }

        // POST: api/group/5/role/2/edit?wid=1
        [HttpPost("{id}/role/{rid}/edit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult EditRole(int id, int rid, [FromBody] GroupRoleCreateModel form, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasRoleManagementAccess(user.Id, wid))
                return Unauthorized();
            WorkspacePermission permission = WorkspacePermission.View;
            foreach (WorkspacePermission perm in form.Permissions)
                permission |= perm;
            if(group.EditRole(rid,form.Name, form.Description, permission))
                return Ok();
            return BadRequest();
        }

        // POST: api/group/5/role/2?wid=1
        [HttpDelete("{id}/role/{rid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult DeleteRole(int id, int rid, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasRoleManagementAccess(user.Id, wid))
                return Unauthorized();
            if(group.DeleteRole(rid))
                return Ok();
            return BadRequest();
        }

        // GET: api/group/5/user/list?wid=1
        [HttpGet("{id}/user/list")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetGroupUsers(int id, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasViewAccess(user.Id, wid))
                return Unauthorized();
            GroupListUserModel model = new GroupListUserModel()
            {
                OwnerId = group.OwnerId,
                Members = group.GetMembers(),
                Roles=new Dictionary<int, string>(group.Roles.Count)
            };
            model.Roles.Add(group.DefaultRole.Id, group.DefaultRole.Name);
            foreach(GroupRole role in group.Roles)
                model.Roles.Add(role.Id, role.Name);
            return Ok(model);
        }

        // POST: api/group/5/user/add?wid=1
        [HttpPost("{id}/user/add")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult AddUser(int id, [FromBody] GroupAddUserModel form, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group)||!UserDatabase.Instance.TryGetUser(form.UserId,out User user2))
                return NotFound();
            if (!group.HasUserManagementAccess(user.Id, wid))
                return Unauthorized();
            group.AddUser(form.UserId, form.RoleId);
            if(!group.IsWorkspaceDefaultGroup)
                user2.Groups.Add(group.Id);
            return Ok();
        }

        // GET: api/group/5/user/2/permission?wid=1
        [HttpGet("{id}/user/{uid}/permission")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetUserPermission(int id, int uid, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasViewAccess(user.Id, wid))
                return Unauthorized();
            if(group.IsWorkspaceDefaultGroup && !group.HasUser(uid))
            {
                if (WorkspaceDatabase.Instance.TryGetWorkspace(group.Workspaces[0], out Workspace ws))
                {
                    if (uid == ws.OwnerId)
                        return Ok((WorkspacePermission)~0u);
                    if (GroupDatabase.Instance.TryGetGroup(ws.GroupOwnerId, out Group group2))
                        return Ok(group2.GetPermission(uid));
                }
                return Ok(WorkspacePermission.None);
            }
            return Ok(group.GetPermission(uid));
        }

        // POST: api/group/5/user/2/role/change?wid=1
        [HttpPost("{id}/user/{uid}/role/change")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult ChangeUserRole(int id, int uid, [FromBody] GroupAddUserModel form, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasUserManagementAccess(user.Id, wid))
                return Unauthorized();
            group.ChangeUserRole(uid, form.RoleId);
            return Ok();
        }

        // DELETE: api/group/5/user/2?wid=1
        [HttpDelete("{id}/user/{uid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult RemoveUser(int id, int uid, [FromQuery] int wid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!GroupDatabase.Instance.TryGetGroup(id, out Group group))
                return NotFound();
            if (!group.HasUserManagementAccess(user.Id, wid))
                return Unauthorized();
            group.RemoveUser(uid);
            user.Groups.Remove(group.Id);
            return Ok();
        }
    }
}

