import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as JWT from './utils/JWT';
import { toast } from './Toast';

interface InvitationPreview {
    type: 'Workspace' | 'Group';
    targetName: string,
    roleName:string,
}

function Join() {

    const [preview, setPreview] = useState<InvitationPreview>({type:'Workspace',targetName:"",roleName:""});
    const [status, setStatus] = useState<number>(0);

    const [params,] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        getInvitation();
    }, []);

    return (
        <div>
            {status == 0 && <p>Looking for the invite on the server...</p>}
            {status == 400 && <p>The invite link cannot be found on the server.</p>}
            {status == 410 && <p>The group or workspace you are invited to is no longer available.</p>}
            {status >= 500 && <p>The server cannot process invites at the time.</p>}
            {status == 200 && <p>You are invited to <label>{preview.targetName}</label> as <label>{preview.roleName}</label></p>}
            {status == 200 && <button onClick={onJoinButton}>Join {preview.type}</button>}
        </div>
    );

    function getInvitation() {
        fetch('/api/invitation?id=' + params.get("id") + "&token=" + params.get("token"), JWT.defaultGETHeader())
            .then(response => {
                setStatus(response.status);
                return response.json();
            })
            .then(data => {
                setPreview(data);
            })
            .catch(error => console.error(error));
    }

    function onJoinButton() {
        if (!JWT.hasJWT()) {
            navigate("/login?next=" + encodeURIComponent("/join"+location.search));
            return;
        }
        fetch('/api/invitation/accept', JWT.defaultPOSTHeader({
            id: params.get("id"),
            token: params.get("token")
        }))
            .then(response => {
                if (response.status == 401)
                    toast.error("Cannot join: \n - Session expired");
                if (response.status == 404)
                    toast.error("Cannot join: \n - Invite link not found on the server");
                if (response.status == 410)
                    toast.error("Cannot join: \n - the group or workspace you are invited to is no longer available");
                if (response.status == 200) {
                    navigate("/home");
                    window.location.reload();
                }
            })
            .catch(error => console.error(error));
    }

}

export default Join;