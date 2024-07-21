using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagementSystem.Server.JsonModels;

namespace TaskManagementSystem.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WorkspaceController : ControllerBase
    {
        // POST: api/workspace/create
        [HttpPost("create")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult CreateWorkspace([FromBody] WorkspaceCreateModel form)
        {
            if(!Authorization.TryGetAuthorizedUser(HttpContext,out User user))
                return Unauthorized();
            if (GroupDatabase.Instance.TryGetGroup(form.GroupOwnerId, out Group group) && !group.GetPermission(user.Id).HasAll(WorkspacePermission.GroupWorkspaceManage))
                return Unauthorized();
            Workspace ws = WorkspaceDatabase.Instance.AddWorkspace(user.Id, form.GroupOwnerId, form.Name, form.Description);
            user.WorkspaceOwned.Add(ws.Id);
            return Ok(ws);
        }

        // GET: api/workspace/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetWorkspace(int id)
        {
            if (!WorkspaceDatabase.Instance.TryGetWorkspace(id, out Workspace ws))
                return NotFound();
            if (!Authorization.IsAuthorizedFor(HttpContext, ws))
                return Unauthorized();
            return Ok(ws);
        }

        // POST: api/workspace/{id}/edit
        [HttpPost("{id}/edit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult EditWorkspace(int id, [FromBody] WorkspaceEditModel form)
        {
            if (!WorkspaceDatabase.Instance.TryGetWorkspace(id, out Workspace ws))
                return NotFound();
            if (!Authorization.IsAuthorizedFor(HttpContext, ws, WorkspacePermission.GroupWorkspaceManage))
                return Unauthorized();
            WorkspaceDatabase.Instance.EditWorkspace(id, form.Name, form.Description);
            return Ok();
        }

        // GET: api/workspace/{id}/todolist
        [HttpGet("{id}/todolist")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult<IEnumerable<TodoItem>> GetWorkspaceTodoList(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!WorkspaceDatabase.Instance.TryGetWorkspace(id, out Workspace ws))
                return NotFound();
            if (ws.HasPermission(user.Id, WorkspacePermission.View))
            {
                return Ok(TodoItemDatabase.Instance.GetItemsFromWorkspace(ws,ws.HasPermission(user.Id,WorkspacePermission.WorkspaceViewDeletedItem)));
            }
            return Unauthorized();
        }

        // POST: api/workspace/{id}/join?gid=1
        [HttpPost("{id}/join")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult JoinWorkspace(int id, [FromQuery] int gid)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!WorkspaceDatabase.Instance.TryGetWorkspace(id, out Workspace ws))
                return NotFound();
            if (!GroupDatabase.Instance.TryGetGroup(gid, out Group group) || !group.HasViewAccess(id))
                return Unauthorized();
            user.WorkspaceJoined.Add(ws.Id);
            return Ok();
        }

        // POST: api/workspace/{id}/leave
        [HttpPost("{id}/leave")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult LeaveWorkspace(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!WorkspaceDatabase.Instance.TryGetWorkspace(id, out Workspace ws)|| !GroupDatabase.Instance.TryGetGroup(ws.DefaultGroupId, out Group group))
                return NotFound();
            user.WorkspaceJoined.Remove(ws.Id);
            group.RemoveUser(user.Id);
            return Ok();
        }

        // DELETE: api/workspace/{id}
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult DeleteWorkspace(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!WorkspaceDatabase.Instance.TryGetWorkspace(id, out Workspace ws))
                return NotFound();
            if (ws.OwnerId != user.Id && !ws.HasPermission(user.Id, WorkspacePermission.GroupWorkspaceManage))
                return Unauthorized();
            WorkspaceDatabase.Instance.RemoveWorkspace(id);
            return Ok();
        }
    }
}
