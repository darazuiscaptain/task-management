using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagementSystem.Server.JsonModels;

namespace TaskManagementSystem.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TodoListController : ControllerBase
    {
        // POST: api/todolist/create
        [HttpPost("create")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult Create([FromBody] TodoItemCreateModel form)
        {
            if (!Authorization.TryGetAuthorizedUser(form.OwnerId, HttpContext, out User user))
                return Unauthorized();
            if (!WorkspaceDatabase.Instance.TryGetWorkspace(form.WorkspaceId, out Workspace ws))
                return BadRequest();
            if (!ws.HasPermission(user.Id, WorkspacePermission.Create))
                return Unauthorized();
            TodoItem item = TodoItemDatabase.Instance.CreateItem(user.Id,ws.Id, form.Title,form.Description);
            ws.TodoItems.Add(item.Id);
            return Ok();
        }

        // POST: api/todolist/5/toggle
        [HttpPost("{id}/toggle")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult Toggle(int id)
        {
            if(!Authorization.TryGetAuthorizedUser(HttpContext,out User user))
                return Unauthorized();
            if(!TodoItemDatabase.Instance.TryGetItem(id, out TodoItem item)||!WorkspaceDatabase.Instance.TryGetWorkspace(item.WorkspaceParentId, out Workspace ws))
                return NotFound();
            if(item.IsDeleted)
                return NotFound();
            if(ws.HasPermission(user.Id, WorkspacePermission.Toggle)
                ||(item.OwnerId==user.Id&&ws.HasPermission(user.Id,WorkspacePermission.ToggleSelf))
                ||(item.AssigneeId==user.Id&&ws.HasPermission(user.Id,WorkspacePermission.ToggleAssigned)))
            {
                TodoItemDatabase.Instance.ToggleItem(id, user.Id);
                return Ok();
            }
            return Unauthorized();
        }

        // POST: api/todolist/5/edit
        [HttpPost("{id}/edit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult Edit(int id, [FromBody] TodoItemEditModel form)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!TodoItemDatabase.Instance.TryGetItem(id, out TodoItem item) || !WorkspaceDatabase.Instance.TryGetWorkspace(item.WorkspaceParentId, out Workspace ws))
                return NotFound();
            if (item.IsDeleted)
                return NotFound();
            if (ws.HasPermission(user.Id, WorkspacePermission.Edit)
                || (item.OwnerId == user.Id && ws.HasPermission(user.Id, WorkspacePermission.EditSelf))
                || (item.AssigneeId == user.Id && ws.HasPermission(user.Id, WorkspacePermission.EditAssigned)))
            {
                TodoItemDatabase.Instance.EditItem(id, user.Id, form.Title, form.Description);
                return Ok();
            }
            return Unauthorized();
        }

        // POST: api/todolist/5/assign
        [HttpPost("{id}/assign")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult Assign(int id, [FromBody] int assignee)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!TodoItemDatabase.Instance.TryGetItem(id, out TodoItem item) || !WorkspaceDatabase.Instance.TryGetWorkspace(item.WorkspaceParentId, out Workspace ws))
                return NotFound();
            if (item.IsDeleted)
                return NotFound();
            if (!UserDatabase.Instance.TryGetUser(assignee, out User user2))
                return BadRequest();
            if (ws.HasPermission(user.Id, WorkspacePermission.Assign)
                || (item.OwnerId == user.Id && ws.HasPermission(user.Id, WorkspacePermission.AssignSelf)))
            {
                TodoItemDatabase.Instance.AssignUserToItem(id, user.Id, assignee);
                return Ok();
            }
            return Unauthorized();
        }

        // POST: api/todolist/5/claim
        [HttpPost("{id}/claim")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult Claim(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!TodoItemDatabase.Instance.TryGetItem(id, out TodoItem item) || !WorkspaceDatabase.Instance.TryGetWorkspace(item.WorkspaceParentId, out Workspace ws))
                return NotFound();
            if (item.IsDeleted)
                return NotFound();
            if (ws.HasPermission(user.Id, WorkspacePermission.Claim)
                || (item.OwnerId == user.Id && ws.HasPermission(user.Id, WorkspacePermission.ClaimSelf)))
            {
                TodoItemDatabase.Instance.ClaimItem(id, user.Id);
                return Ok();
            }
            return Unauthorized();
        }

        // POST: api/todolist/5/archive
        [HttpPost("{id}/archive")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult Archive(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!TodoItemDatabase.Instance.TryGetItem(id, out TodoItem item) || !WorkspaceDatabase.Instance.TryGetWorkspace(item.WorkspaceParentId, out Workspace ws))
                return NotFound();
            if (item.IsDeleted)
                return NotFound();
            if (ws.HasPermission(user.Id, WorkspacePermission.Archive)
                || (item.OwnerId == user.Id && ws.HasPermission(user.Id, WorkspacePermission.ArchiveSelf)))
            {
                TodoItemDatabase.Instance.ArchiveItem(id, user.Id);
                return Ok();
            }
            return Unauthorized();
        }

        // Delete: api/todolist/5
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult Delete(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!TodoItemDatabase.Instance.TryGetItem(id, out TodoItem item) || !WorkspaceDatabase.Instance.TryGetWorkspace(item.WorkspaceParentId, out Workspace ws))
                return NotFound();
            if (item.IsDeleted)
                return NotFound();
            if (ws.HasPermission(user.Id, WorkspacePermission.Delete)
                || (item.OwnerId == user.Id && ws.HasPermission(user.Id, WorkspacePermission.DeleteSelf)))
            {
                TodoItemDatabase.Instance.DeleteItem(id, user.Id);
                return Ok();
            }
            return Unauthorized();
        }

        // GET: api/todolist/5/history
        [HttpGet("{id}/history")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetHistory(int id)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!TodoItemDatabase.Instance.TryGetItem(id, out TodoItem item) || !WorkspaceDatabase.Instance.TryGetWorkspace(item.WorkspaceParentId, out Workspace ws))
                return NotFound();
            if (item.IsDeleted&&!ws.HasPermission(user.Id, WorkspacePermission.WorkspaceViewDeletedItem))
                return NotFound();
            if (ws.HasPermission(user.Id, WorkspacePermission.View))
            {
                return Ok(item.EditHistory);
            }
            return Unauthorized();
        }
    }
}

