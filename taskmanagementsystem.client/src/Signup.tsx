import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as JWT from './utils/JWT';
import * as Session from './utils/Session';
import { toast } from './Toast';

function Signup() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [username, setUsername] = useState("");
    const [confirmUsername, setConfirmUsername] = useState(true);
    const [confirmEmail, setConfirmEmail] = useState(true);
    const [confirmPassword, setConfirmPassword] = useState(true);
    const [confirmPassword2, setConfirmPassword2] = useState(true);

    const [params,] = useSearchParams();
    const navigate = useNavigate();

    const contents =
        <div>
            <div>
                <input
                    value={username}
                    placeholder="Your name"
                    onChange={(ev) => { setUsername(ev.target.value); setConfirmUsername(ev.target.value.length > 0); }}
                />
                <br />
                <label hidden={confirmUsername}>Username cannot be empty!</label>
            </div>
            <br />
            <div>
                <input
                    type="email"
                    value={email}
                    placeholder="Your email"
                    onChange={(ev) => { setEmail(ev.target.value); setConfirmEmail(ev.target.value.length > 0); }}
                />
                <br />
                <label hidden={confirmEmail}>Email address is not valid or already registered!</label>
            </div>
            <br />
            <div>
                <input
                    type="password"
                    value={password}
                    placeholder="Your password"
                    onChange={(ev) => { setPassword(ev.target.value); setConfirmPassword(ev.target.value.length > 0); }}
                />
                <br />
                <label hidden={confirmPassword}>Password cannot be empty!</label>
            </div>
            <br />
            <div>
                <input
                    type="password"
                    value={password2}
                    placeholder="Confirm password"
                    onChange={(ev) => { setPassword2(ev.target.value); setConfirmPassword2(ev.target.value===password); }}
                />
                <br />
                <label hidden={confirmPassword2}>Password is not the same!</label>
            </div>
            <br />
            <div>
                <button onClick={onSignupButton}>Sign up</button>
            </div>
        </div>;



    return (
        JWT.hasJWT() ?
            <div /> :
            <div>
                <h1>Signup</h1>
                <button onClick={onLoginButton}>Got account? Log in</button>
                <br></br>
                {contents}
            </div>
    );

    function onLoginButton() {
        navigate("/login" + location.search);
    }

    function onSignupButton() {
        if (username.length == 0)
            setConfirmUsername(false);
        if (email.length == 0)
            setConfirmEmail(false);
        if (password.length == 0)
            setConfirmPassword(false);
        if (password!==password2)
            setConfirmPassword2(false);
        if (!(confirmPassword && confirmPassword2 && confirmUsername && confirmEmail))
            return;
        const req = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: username,
                email: email,
                password: password
            })
        };
        fetch('/api/user/signup', req)
            .then(response => {
                if (response.status == 401) {
                    toast.warning("Cannot sign up: \n - The email account is already registered");
                    return;
                }
                    
                if (response.status == 200) {
                    response.json()
                        .then(data => {
                            JWT.setJWT(data.jwt);
                            Session.setSession(data.id);
                        })
                        .catch(error => console.error(error));
                } else {
                    toast.error("Error signing in: " + response.status);
                    return;
                }
                if (params.has("next")) {
                    navigate(decodeURIComponent(params.get("next")))
                } else {
                    navigate("/home");
                }
                window.location.reload();
            })
            .catch(error => console.error(error));
    }

}

export default Signup;