using TaskManagementSystem.Server.JsonModels;

namespace TaskManagementSystem.Server
{
    public class UserDatabase
    {
        private static readonly UserDatabase _instance;
        public static UserDatabase Instance { get { return _instance; } }

        static UserDatabase()
        {
            _instance = new UserDatabase();
            AddTestUser();
        }

        Dictionary<int, User> userById = new Dictionary<int, User>();
        Dictionary<string, User> userByEmail = new Dictionary<string, User>();
        int next_id = 1;

        [Obsolete]
        public static void AddTestUser()
        {
            User user = new User() { Id=_instance.next_id++, Username="test", Email="test@test.com", Password="test" };
            user.WorkspaceJoined=new List<int>();
            user.WorkspaceOwned=new List<int>();
            user.Invitations=new List<int>();
            _instance.userById.Add(user.Id, user);
            _instance.userByEmail.Add(user.Email.ToLower(), user);
        }

        public bool TryAuthenticate(UserLoginModel login, out User user)
        {
            if (!userByEmail.TryGetValue(login.Email.ToLower(), out user))
                return false;
            return user.Password.Equals(login.Password);
        }

        public bool TryAddUser(string username, string email, string password, out User user)
        {
            if (userByEmail.ContainsKey(email.ToLower()))
            {
                user = null;
                return false;
            }
            user = new User() { Id = _instance.next_id++, Username = username, Email = email, Password = password };
            user.WorkspaceJoined = new List<int>();
            user.WorkspaceOwned = new List<int>();
            user.Invitations= new List<int>();
            _instance.userById.Add(user.Id, user);
            _instance.userByEmail.Add(user.Email.ToLower(), user);
            return true;
        }

        public bool TryGetUser(string email, out User user)
        {
            return userByEmail.TryGetValue(email.ToLower(), out user);
        }

        public bool TryGetUser(int id, out User user)
        {
            return userById.TryGetValue(id, out user);
        }
    }
}
