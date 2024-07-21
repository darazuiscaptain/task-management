import { useNavigate } from 'react-router-dom'
import * as JWT from './utils/JWT';
import * as Cache from './utils/Cache'
import * as Session from './utils/Session';

function Signout() {

    const navigate = useNavigate();

    return (
        !JWT.hasJWT() ?
            <div /> :
            <div>
                <button onClick={onSignoutButton}>Sign out</button>
            </div>
    );

    function onSignoutButton() {
        JWT.resetJWT();
        Session.resetSession();
        Cache.invalidateCaches();
        navigate("/");
        window.location.reload();
    }

}

export default Signout;