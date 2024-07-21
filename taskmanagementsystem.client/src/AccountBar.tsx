import { Link } from 'react-router-dom'
import Signout from './Signout'
import * as JWT from './utils/JWT';
import './Navbar.css';

function AccountBar() {

    return (
        !JWT.hasJWT() ?
            <div id="navbar">
                <div className='filler'></div>
                <div className='right-align'><Link to="/login">Login</Link></div>
                <div className='right-align'><Link to="/signup">Signup</Link></div>
            </div> :
            <div id="navbar">
                <div className='left-align'><Link to="/home">Workspaces</Link></div>
                <div className='left-align'><Link to="/group">Groups</Link></div>
                <div className='filler'></div>
                <div className='right-align'><Signout /></div>
                <div></div>
            </div>
    );

}

export default AccountBar;