function hasSession() {
    return sessionStorage.getItem("uid") !== null;
}
function getSession() {
    return Number(sessionStorage.getItem("uid"));
}
function setSession(uid:number|string) {
    sessionStorage.setItem("uid", uid+"");
}
function resetSession() {
    sessionStorage.removeItem("uid");
}

export { hasSession, getSession, setSession, resetSession }