function hasJWT() {
    return sessionStorage.getItem("jwt") !== null;
}
function getJWT() {
    return sessionStorage.getItem("jwt");
}
function setJWT(jwt:string) {
    sessionStorage.setItem("jwt",jwt);
}
function resetJWT() {
    sessionStorage.removeItem("jwt");
}

function defaultGETHeader() {
    return {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer '+getJWT()
        }
    };
}

function defaultPOSTHeader(body?:any) {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getJWT()
        },
        body:JSON.stringify(body)
    };
}

function defaultDELETEHeader() {
    return {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getJWT()
        }
    };
}

export { hasJWT, getJWT, setJWT, resetJWT, defaultGETHeader, defaultPOSTHeader, defaultDELETEHeader }