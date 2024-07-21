using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagementSystem.Server.JsonModels;

namespace TaskManagementSystem.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InvitationController : ControllerBase
    {

        // POST: api/invitation/create
        [HttpPost("create")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public ActionResult Create([FromBody] InvitationCreateModel form)
        {
            if (!Authorization.TryGetAuthorizedUser(form.OwnerId, HttpContext, out User user))
                return Unauthorized();
            Workspace ws = null;
            if(form.Type==InvitationType.Workspace)
            {
                if(!WorkspaceDatabase.Instance.TryGetWorkspace(form.TargetId, out ws))
                    return BadRequest();
                if (!ws.HasAnyPermission(user.Id, WorkspacePermission.WorkspaceInviteCreate | WorkspacePermission.WorkspaceUserManage | WorkspacePermission.GroupUserManage))
                    return Unauthorized();
            }else if (form.Type == InvitationType.Group)
            {
                if (!GroupDatabase.Instance.TryGetGroup(form.TargetId, out Group group) || !group.HasUserManagementAccess(user.Id))
                    return Unauthorized();
            }
            else
            {
                return BadRequest();
            }
            
            Invitation inv = InvitationDatabase.Instance.AddInvitation(user.Id, form.Type, form.TargetId, form.TargetRoleId, form.Name);
            if(form.Type== InvitationType.Workspace)
                ws?.Invitations.Add(inv.Id);
            user.Invitations.Add(inv.Id);
            return Ok(inv);
        }

        // GET: api/invitation?id=1&token=2
        [HttpGet("")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status410Gone)]
        public ActionResult Get([FromQuery] int id, [FromQuery] long token)
        {
            if(!InvitationDatabase.Instance.TryGetInvitation(id,out Invitation inv)||inv.Token!=token)
                return NotFound();
            InvitationPreviewModel result = new InvitationPreviewModel();
            if (inv.Type == InvitationType.Workspace)
            {
                if(!WorkspaceDatabase.Instance.TryGetWorkspace(inv.TargetId,out Workspace ws)||!GroupDatabase.Instance.TryGetGroup(ws.DefaultGroupId,out Group group))
                    return StatusCode(410);
                result.Type = InvitationType.Workspace;
                result.TargetName = ws.Name;
                result.RoleName = group.Roles.FirstOrDefault(r => r.Id == inv.TargetRoleId, group.DefaultRole).Name;
            }
            else
            {
                if (!GroupDatabase.Instance.TryGetGroup(inv.TargetId, out Group group))
                    return StatusCode(410);
                result.Type = InvitationType.Group;
                result.TargetName = group.Name;
                result.RoleName = group.Roles.FirstOrDefault(r => r.Id == inv.TargetRoleId, group.DefaultRole).Name;
            }
            return Ok(result);
        }

        // POST: api/invitation/accept
        [HttpPost("accept")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status410Gone)]
        public ActionResult Accept([FromBody] InvitationAcceptModel form)
        {
            if (!Authorization.TryGetAuthorizedUser(HttpContext, out User user))
                return Unauthorized();
            if (!InvitationDatabase.Instance.TryGetInvitation(form.Id, out Invitation inv)||inv.Token!=form.Token)
                return NotFound();
            if (inv.IsPaused || inv.IsDeleted)
                return StatusCode(410);
            Workspace ws = null;
            Group group = null;
            if (inv.Type == InvitationType.Workspace && !WorkspaceDatabase.Instance.TryGetWorkspace(inv.TargetId, out ws)
                ||
                inv.Type == InvitationType.Group && !GroupDatabase.Instance.TryGetGroup(inv.TargetId, out group))
                return StatusCode(410);
            inv.Clicks++;
            if(inv.HasJoinLimit&&inv.Joins>=inv.JoinLimit)
                return StatusCode(410);
            inv.Joins++;
            if(inv.Type== InvitationType.Workspace)
            {
                user.WorkspaceJoined.Add(inv.TargetId);
                if (!user.Groups.Contains(ws.GroupOwnerId))
                {
                    GroupDatabase.Instance.TryGetGroup(ws.DefaultGroupId, out group);
                    group.AddUser(user.Id, inv.TargetRoleId);
                } 
            }else if(inv.Type == InvitationType.Group)
            {
                group.AddUser(user.Id,inv.TargetRoleId);
                if(!user.Groups.Contains(inv.TargetId))
                    user.Groups.Add(inv.TargetId);
            }
            return Ok();
        }
    }
}

