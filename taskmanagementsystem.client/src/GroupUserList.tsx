import { useEffect, useRef, useState } from 'react';
import * as JWT from './utils/JWT';
import { useCache } from './utils/Cache';
import { Group, UserList, InviteCreateModel, Permission, hasAllPermission } from './types/Types'
import Username from './Username.jsx'
import FoldableContainer from './FoldableContainer';
import { DraggableElement, DraggableElementContainer } from './Draggable';
import * as Session from './utils/Session';
import { toast } from './Toast';

function GroupUserList({ gid,wid }: { gid: number,wid:number }) {

    const [userList, setUserList] = useState<UserList>();
    const [editUserList, setEditUserList] = useState<UserList>();
    const [editMode, setEditMode] = useState<boolean>(false);
    const [changed, setChanged] = useState<boolean>(false);
    const draggingRef = useRef<string>("");

    const query = wid==0 ? "" : "?wid=" + wid;
    const [group,] = useCache<Group>("group", undefined, gid, query);
    const [permission, refreshPermission] = useCache<Permission>("permission", Permission.View, gid, query);
    const canEdit = hasAllPermission(permission, Permission.GroupUserManage);
    const canInvite = canEdit || wid > 0 && hasAllPermission(permission, Permission.WorkspaceInviteCreate);

    useEffect(() => {
        getUserList();
    }, [group]);

    const contents = userList === undefined
        ? <p><em>Loading... </em></p>
        : <div>
            <div style={{ margin: 'inherit', display: 'flex'}}>
                {canEdit && !editMode && <button style={{marginLeft:'auto',marginRight:'0'}} onClick={toggleEdit}>Manage users</button>}
                {canEdit && editMode && <><button style={{ marginLeft: 'auto', marginRight: '0' }} onClick={cancelEdit}>Cancel</button><button style={{ marginLeft: '8px', marginRight: '0' }} disabled={!changed} onClick={commitEdit}>Update</button></>}
            </div>
            
            {Object.keys(userList.roles).map(rid =>
                <FoldableContainer key={rid} title={userList.roles[rid]+' ('+(editMode?editUserList:userList).members[rid].length+')'}>
                    {!editMode&&<div style={{ margin: 'inherit', display: 'flex', flexWrap: 'wrap' }}>
                        {userList.members[rid].map(uid =>
                            <div key={uid} style={{ margin: 'inherit', whiteSpace: 'nowrap' }}><Username uid={uid} /></div>
                        )}
                        {canInvite && <button style={{ margin: 'inherit', whiteSpace: 'nowrap' }} onClick={() => onInvite(Number(rid))}>Invite users</button>}
                    </div>}
                    {editMode && <DraggableElementContainer id={"role_" + rid} style={{ margin: 'inherit' }} testDragOver={testDragOver} onDrop={onDrop}>
                        <div style={{ margin: 'inherit', display: 'flex', flexWrap: 'wrap' }}>
                            {editUserList.members[rid].map(uid =>
                                <DraggableElement key={uid} ref={draggingRef} id={String(uid)} style={{ margin: 'inherit' }} >
                                    <div key={uid} style={{ margin: 'inherit', whiteSpace: 'nowrap' }}><Username uid={uid} /></div>
                                </DraggableElement>

                            )}
                            <button style={{ margin: 'inherit', whiteSpace: 'nowrap' }} onClick={()=>onInvite(Number(rid))}>Invite users</button>
                        </div>
                    </DraggableElementContainer> }
                </FoldableContainer>
            )}
            {canEdit && editMode &&
                <FoldableContainer key={"-1"} title={'Evict users (' + editUserList.members["-1"].length + ')'}>

                    <DraggableElementContainer id={"role_-1"} style={{ margin: 'inherit' }} testDragOver={testDragOver} onDrop={onDrop}>
                        <div style={{ margin: 'inherit', display: 'flex', flexWrap: 'wrap' }}>
                            {editUserList.members["-1"].map(uid =>
                                <DraggableElement key={uid} ref={draggingRef} id={String(uid)} style={{ margin: 'inherit' }} >
                                    <div key={uid} style={{ margin: 'inherit', whiteSpace: 'nowrap' }}><Username uid={uid} /></div>
                                </DraggableElement>

                            )}
                            <button style={{ margin: 'inherit', whiteSpace: 'nowrap' }} disabled>Drag user here</button>
                        </div>
                    </DraggableElementContainer>
                </FoldableContainer>}
        </div>;

    return (
        <div style={{margin:'inherit'}}>
            {contents}
        </div>
    );


    async function getUserList() {
        fetch('/api/group/' + gid + '/user/list' + query, JWT.defaultGETHeader())
            .then(response => {
                if (response.status == 404) {
                    toast.error("Cannot load user list: \n - The group is no longer available");
                    return undefined;
                }
                if (response.status == 401) {
                    toast.error("Cannot load user list: \n - You do not have permission to view the group; or \n - Session Expired");
                    return undefined;
                }
                return response.json();
            })
            .then(data => {
                setUserList(data);
            })
            .catch(error => console.error(error));
    }

    function toggleEdit() {
        if (!editMode) {
            let list = structuredClone(userList);
            list.members["-1"]=new Array<number>()
            setEditUserList(list);
            setChanged(false);
        }
        setEditMode(!editMode);
    }

    function cancelEdit() {
        if (!changed || confirm("Are you sure you want to discard changes?"))
            toggleEdit();
    }

    async function commitEdit() {
        if (!changed)
            return;
        const promises = []
        let shouldRefreshPermission = false;
        for (var r of Object.keys(userList.roles)) {
            let diff = editUserList.members[r].filter(u => userList.members[r].indexOf(u) < 0);
            if (diff.indexOf(Session.getSession()) >= 0)
                shouldRefreshPermission = true;
            diff.map(uid =>
                promises.push(fetch('/api/group/' + gid + '/user/' + uid + '/role/change' + query, JWT.defaultPOSTHeader({
                    userId: uid,
                    roleId: Number(r)
                }))));
        }
        editUserList.members["-1"].map(uid =>
            promises.push(fetch('/api/group/' + gid + '/user/' + uid + query, JWT.defaultDELETEHeader()))
        );
        if (editUserList.members["-1"].indexOf(Session.getSession()) >= 0)
            shouldRefreshPermission = true;
        const responses = await Promise.all(promises);
        const statusCodes = await Promise.all(responses.map((r: Response) => r.status))
        for (var code of statusCodes) {
            if (code != 200) {
                toast.error("Error updating group users: \n - Session expired");
                return;
            }
        }
        toast.info("User list updated");
        if (shouldRefreshPermission)
            refreshPermission();
        setEditMode(false);
        getUserList();
    }

    function testDragOver(id: string, pid: string): boolean {
        return id.startsWith("role_") || pid.startsWith("role_")
    }

    function onDrop(id: string) {
        for (var s of Object.keys(editUserList.members)) {
            let uid = Number(draggingRef.current);
            if (editUserList.members[s].find(u => u == uid) !== undefined) {
                if ('role_' + s !== id) {
                    editUserList.members[s] = editUserList.members[s].filter(u => u !=uid)
                    editUserList.members[id.substring(5)].push(uid)
                    setChanged(true);
                    setEditUserList({
                        ownerId: editUserList.ownerId,
                        roles: editUserList.roles,
                        members:editUserList.members
                    })
                }
            }
        }
            
    }

    function onInvite(rid: number) {
        let isgroup = wid==0;
        let inv: InviteCreateModel = {
            name: "New invite",
            ownerId: Session.getSession(),
            type: isgroup?'Group':'Workspace',
            targetId: isgroup?gid:wid,
            targetRoleId:rid
        }
        fetch('/api/invitation/create', JWT.defaultPOSTHeader(inv))
            .then(response => {
                if (response.status === 400) {
                    toast.error("Cannot create invite link: \n - Session expired");
                    return undefined;
                }
                return response.json();
            })
            .then(data => {
                if (data === undefined)
                    return;
                let url = window.location.origin+"/join?id=" + data.id + "&token=" + data.token;
                navigator.clipboard.writeText(url);
                toast.info("Invite link copied to clipboard");
            })
            .catch(error => console.error(error));
    }

}

export default GroupUserList;