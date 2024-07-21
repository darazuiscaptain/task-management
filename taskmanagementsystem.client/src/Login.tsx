import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as JWT from './utils/JWT';
import * as Session from './utils/Session';
import { toast } from './Toast';

function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmLogin, setConfirmLogin] = useState(true);

    const [params,] = useSearchParams();
    const navigate = useNavigate();

    const contents =
        <div>
            <div>
                <input
                    type="email"
                    value={email}
                    placeholder="Enter your email"
                    onChange={(e) => { setEmail(e.target.value); setConfirmLogin(true); }}
                />
            </div>
            <br />
            <div>
                <input
                    type="password"
                    value={password}
                    placeholder="Enter your password"
                    onChange={(e) => { setPassword(e.target.value); setConfirmLogin(true); }}
                />
            </div>
            <br />
            <label style={{ color: 'darkred' }} hidden={confirmLogin}>Incorrect email or password!</label>
            <div>
                <button onClick={onLoginButton}>Log in</button>
            </div>
        </div>;



    return (
        JWT.hasJWT() ?
        <div />:
        <div>
                <h1>Login</h1>
                <button onClick={onSignupButton}>No account? Sign up</button>
                <br></br><br></br>
            {contents}
        </div>
    );

    function onSignupButton() {
        navigate("/signup" + location.search)
    }

    function onLoginButton() {
        const req = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password:password
            })
        };
        fetch('/api/user/login',req)
            .then(response => {
                if (response.status == 401) {
                    setConfirmLogin(false);
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

export default Login;