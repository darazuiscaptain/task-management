import { useState } from 'react';
import * as JWT from './utils/JWT';
import TodoList from './TodoList';
import { Link, useNavigate } from 'react-router-dom';
import {Workspace,Permission, hasAllPermission, Group, WorkspaceList } from './types/Types'
import { useCache, useCacheInvalidation } from './utils/Cache';
import FoldableContainer from './FoldableContainer';
import { toast } from './Toast';
import Groupname from './Groupname';
import { getSession } from './utils/Session';

function WorkspaceContainerHeaderArea({ wid, gid }: { wid: number, gid: number }) {

    const [manageMode, setManageMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [title, setTitle] = useState<string>();
    const [description, setDescription] = useState<string>();

    const [workspace, refreshWorkspace] = useCache<Workspace>("workspace", undefined, wid);
    const invalidateGroup = useCacheInvalidation<Group>("group", gid);
    const [, refreshWorkspaceList] = useCache<WorkspaceList>("workspacelist", undefined, getSession());
    const [permission, ] = useCache<Permission>("permission", Permission.View, gid, "?wid=" + wid);
    const navigate = useNavigate();

    const contents = workspace === undefined
        ? <p><em>Loading... </em></p>
        : <>
            <div style={{ margin: 'inherit', display: 'flex', flexDirection: 'column' }}>
                {workspace.groupOwnerId > 0 && <label style={{ fontSize: 'larger', marginTop: 'auto', marginBottom: 'auto' }}>Belongs to: <Link to={'/group?gid=' + workspace.groupOwnerId}><Groupname gid={workspace.groupOwnerId} /></Link></label>}
                {!editMode && <p>{workspace.description}</p>}
                {editMode && <input value={title} onInput={e => setTitle(e.currentTarget.value)} />}
                {editMode && <textarea value={description} onInput={e => setDescription(e.currentTarget.value)} />}
            </div>
            <div style={{ margin: 'inherit', display: 'flex' }}>
                {hasAllPermission(permission, Permission.GroupWorkspaceManage) && <button onClick={onManage}>{manageMode ? "Back..." : "Manage..."}</button>}
                {manageMode && <button style={{ marginLeft: '1em', marginRight: '0.5em' }} onClick={onEdit}>{editMode ? "Cancel" : "Edit"}</button>}
                {manageMode && editMode && <button onClick={commitEdit}>Save</button>}
                {manageMode && workspace.ownerId != getSession() && <button className='dangerous-button' onClick={onLeave}>Leave</button>}
                {manageMode && workspace.ownerId == getSession() && <button className='dangerous-button' onClick={onDelete}>Delete</button>}
                <button style={{ marginLeft: 'auto', marginRight: '0' }} onClick={onGroupButton}>View Group</button>
            </div>
        </>;

    return (
        <div style={{margin:'inherit'}}>
                {contents}
            </div>
    );

    function onManage() {
        setManageMode(!manageMode);
        setEditMode(false);
    }

    function onEdit() {
        if (!editMode) {
            setTitle(workspace.name);
            setDescription(workspace.description);
        }
        setEditMode(!editMode);
    }

    function commitEdit() {
        fetch('/api/workspace/' + wid + '/edit', JWT.defaultPOSTHeader({
            name: title,
            description:description
        }))
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot edit: \n - Session Expired");
                    return;
                } else if (response.status == 404) {
                    toast.error("Cannot edit: \n - The item you are looking for is no longer available");
                    return;
                }
                toast.info("Workspace info updated");
                setEditMode(false);
                invalidateGroup();
                refreshWorkspace();
            })
            .catch(error => console.error(error));
    }

    function onLeave() {
        if (!confirm("Are you sure you want to leave " + workspace.name + "?"))
            return;
        fetch('/api/workspace/' + wid + '/leave', JWT.defaultPOSTHeader())
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot leave workspace: \n - Session expired");
                    return;
                }
                if (response.status == 404) {
                    toast.error("Cannot leave workspace: \n - The workspace is no longer available");
                    return;
                }
                if (response.status == 200) {
                    toast.info('Left "' + workspace.name + '"');
                    refreshWorkspaceList();
                    return;
                }
                console.log(response);
            })
            .catch(error => console.error(error));
    }

    function onDelete() {
        if (!confirm("Are you sure you want to delete " + workspace.name + "?"))
            return;
        fetch('/api/workspace/' + wid, JWT.defaultDELETEHeader())
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot delete workspace: \n - Session expired");
                    return;
                }
                if (response.status == 404) {
                    toast.error("Cannot delete workspace: \n - The workspace is no longer available");
                    return;
                }
                if (response.status == 200) {
                    toast.info('Deleted "' + workspace.name + '"');
                    refreshWorkspaceList();
                    return;
                }
                console.log(response);
            })
            .catch(error => console.error(error));
    }

    function onGroupButton() {
        navigate('/group?gid=' + workspace.defaultGroupId + '&wid=' + workspace.id);
    }
}

function WorkspaceContainer({ wid }: {wid:number}) {

    const [workspace,] = useCache<Workspace>("workspace", undefined, wid);

    const contents = workspace === undefined
        ? <p><em>Loading... </em></p>
        : <FoldableContainer title={workspace.name}>
            <WorkspaceContainerHeaderArea wid={wid} gid={workspace.defaultGroupId} />
            <TodoList wid={wid} gid={workspace.defaultGroupId} />
        </FoldableContainer>;


    return (
        !JWT.hasJWT() ?
        <div></div>:
        <div>
            {contents}
        </div>
    );
}

export default WorkspaceContainer;