namespace TaskManagementSystem.Server
{
    public class InvitationDatabase
    {
        private static readonly InvitationDatabase _instance;
        public static InvitationDatabase Instance { get { return _instance; } }

        static InvitationDatabase()
        {
            _instance = new InvitationDatabase();
        }

        Dictionary<int, Invitation> invitationById = new Dictionary<int, Invitation>();
        int next_id = 1;

        public Invitation AddInvitation(int ownerid,InvitationType type,int targetid,int roleid, string name)
        {
            Invitation invitation = new Invitation()
            {
                Name = name,
                OwnerId = ownerid,
                Id = next_id++,
                Type = type,
                TargetId = targetid,
                TargetRoleId = roleid
            };
            invitationById.Add(invitation.Id, invitation);
            return invitation;
        }

        public bool TryGetInvitation(int id, out Invitation inv)
        {
            if (invitationById.ContainsKey(id))
                return (inv = invitationById[id]) != null;
            inv = null;
            return false;
        }
    }
}
