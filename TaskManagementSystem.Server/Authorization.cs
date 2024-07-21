using System.Security.Claims;

namespace TaskManagementSystem.Server
{
    public static class Authorization
    {
        public static string GetJwtSubject(HttpContext context)
        {
            return context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        public static bool IsSameUser(int id, HttpContext context)
        {
            return int.TryParse(GetJwtSubject(context), out int uid) && uid == id;
        }

        public static bool TryGetAuthorizedUser(int id, HttpContext context, out User user)
        {
            if (!int.TryParse(GetJwtSubject(context), out int uid) || uid!=id)
            {
                user = null;
                return false;
            }
            return UserDatabase.Instance.TryGetUser(id, out user);
        }

        public static bool TryGetAuthorizedUser(HttpContext context, out User user)
        {
            if (!int.TryParse(GetJwtSubject(context), out int id))
            {
                user = null;
                return false;
            }
            return UserDatabase.Instance.TryGetUser(id, out user);
        }

        public static bool IsAuthorizedFor(HttpContext context, Workspace ws, WorkspacePermission permission = WorkspacePermission.View)
        {
            return int.TryParse(GetJwtSubject(context), out int id) && ws.HasPermission(id, permission);
        }
    }
}
