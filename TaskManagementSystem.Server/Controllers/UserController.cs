using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagementSystem.Server.JsonModels;

namespace TaskManagementSystem.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        // POST: api/user/signup
        [HttpPost("signup")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [AllowAnonymous]
        public ActionResult Signup([FromBody] UserSignupModel signup)
        {
            if (!UserDatabase.Instance.TryAddUser(signup.UserName, signup.Email, signup.Password, out User user))
                return Conflict();
            return Ok(new UserJWTOutboundModel() { Id = user.Id, Jwt = Authenticator.GenerateToken(user) });
        }

        // POST: api/user/login
        [HttpPost("login")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [AllowAnonymous]
        public ActionResult Login([FromBody] UserLoginModel login)
        {
            if (!UserDatabase.Instance.TryAuthenticate(login, out User user))
                return Unauthorized();
            return Ok(new UserJWTOutboundModel() { Id = user.Id, Jwt = Authenticator.GenerateToken(user) });
        }

        // GET: api/user/{id}
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetUser(int id)
        {
            if (!UserDatabase.Instance.TryGetUser(id, out User user))
                return NotFound();
            if (!Authorization.IsSameUser(user.Id, HttpContext))
                return Unauthorized();
            return Ok(user);
        }

        // GET: api/user/{id}/public/username
        [HttpGet("{id}/public/username")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [AllowAnonymous]
        public ActionResult GetUsername(int id)
        {
            if(!UserDatabase.Instance.TryGetUser(id,out User user))
                return NotFound();
            return Ok(user.Username);
        }

        // GET: api/user/{id}/workspaces
        [HttpGet("{id}/workspaces")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public ActionResult GetUserWorkspaces(int id)
        {
            if (!UserDatabase.Instance.TryGetUser(id, out User user))
                return NotFound();
            if (!Authorization.IsSameUser(user.Id,HttpContext))
                return Unauthorized();

            WorkspaceListModel model = new WorkspaceListModel()
            {
                Owned = user.WorkspaceOwned,
                Joined = user.WorkspaceJoined
            };
            return Ok(model);
        }
    }
}
