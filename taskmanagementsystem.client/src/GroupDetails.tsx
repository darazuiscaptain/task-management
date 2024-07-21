import { useEffect, useState } from 'react';
import * as JWT from './utils/JWT';
import { useCache } from './utils/Cache';
import { Group } from './types/Types'
import FoldableContainer from './FoldableContainer';
import GroupRoles from './GroupRoles'
import GroupUserList from './GroupUserList'
import { useNavigate } from 'react-router-dom';
import Username from './Username';
import { toast } from './Toast';
import { getSession } from './utils/Session';
import HelpElement from './HelpElement';
import GroupWorkspaceList from './GroupWorkspaceList';

function GroupDetails({ gid, wid = 0, hideFoldableBanner = false }: {gid:number,wid?:number,hideFoldableBanner?:boolean}) {

    const [manageMode, setManageMode] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [title, setTitle] = useState<string>();
    const [description, setDescription] = useState<string>();

    const query = wid==0 ? "" : "?wid=" + wid;

    const [refresh, setRefresh] = useState(false);
    const [group, refreshGroup] = useCache<Group>("group", undefined, gid, query);

    const navigate = useNavigate();

    useEffect(() => {
        if (refresh) {
            setRefresh(false);
            toast.info("Group refreshed");
        }
    }, [refresh]);

    const defaultGroupTooltip =
        <>
            <p>- Users invited to this workspace will be put here, if they are not in the same group the workspace belongs to</p>
            <p>- Members from the group that owns this workspace carry their permissions over</p>
            <p>- Group admin can override members permission for this workspace by assigning them a role here</p>
        </>;

    const contents =
        <div style={{ margin: 'inherit' }}>
            <FoldableContainer title="Users"><GroupUserList gid={gid} wid={wid} /></FoldableContainer>
            <FoldableContainer title="Roles"><GroupRoles gid={gid} wid={wid} /></FoldableContainer>
            {group !== undefined && !group.isWorkspaceDefaultGroup && <FoldableContainer title="Workspaces"><GroupWorkspaceList gid={gid} /></FoldableContainer>}
        </div>

    const header = group === undefined ? <></>
        : <div style={{ margin: 'inherit' }}>
            {hideFoldableBanner && <h2>{group.name}</h2>}
            {group.ownerId > 0 && <label style={{ fontSize: 'larger', marginTop: 'auto', marginBottom: 'auto' }}>Group owner: <Username uid={group.ownerId} /></label>}
            <div style={{ margin: 'inherit', display: 'flex', flexDirection: 'column' }}>
                {!editMode && (group.isWorkspaceDefaultGroup ? <HelpElement text={defaultGroupTooltip}><p>{group.description}</p></HelpElement> : <p>{group.description}</p>)}
                {editMode && <input value={title} onInput={e => setTitle(e.currentTarget.value)} />}
                {editMode && <textarea value={description} onInput={e => setDescription(e.currentTarget.value)} />}
            </div>
            <div style={{ margin: 'inherit', display: 'flex' }}>
                {group.ownerId == getSession() && <button onClick={onManage}>{manageMode ? "Back..." : "Manage..."}</button>}
                {manageMode && <button style={{ marginLeft: '1em', marginRight: '0.5em' }} onClick={onEdit}>{editMode ? "Cancel" : "Edit"}</button>}
                {manageMode && editMode && <button onClick={commitEdit}>Save</button>}
                {manageMode && group.ownerId == getSession() && <button className='dangerous-button' onClick={onDelete}>Delete</button>}
                <button style={{ marginLeft: 'auto', marginRight: '0' }} onClick={onRefresh} disabled={refresh}>Refresh</button>
            </div>
        </div>

    return (
        hideFoldableBanner
            ? <div style={{ margin: '1em' }}>
                {header}
                {contents}
            </div>
            : <FoldableContainer title={group === undefined ? "Loading..." : group.name}>
                {header}
                {contents}
            </FoldableContainer>
    );

    function onRefresh() {
        refreshGroup();
        setRefresh(true);
    }

    function onManage() {
        setManageMode(!manageMode);
        setEditMode(false);
    }

    function onEdit() {
        if (!editMode) {
            setTitle(group.name);
            setDescription(group.description);
        }
        setEditMode(!editMode);
    }

    function commitEdit() {
        fetch('/api/group/' + gid + '/edit', JWT.defaultPOSTHeader({
            name: title,
            description: description
        }))
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot edit: \n - Session Expired");
                    return;
                } else if (response.status == 404) {
                    toast.error("Cannot edit: \n - The item you are looking for is no longer available");
                    return;
                }
                setEditMode(false);
                refreshGroup();
            })
            .catch(error => console.error(error));
    }

    function onDelete() {
        if (!confirm("Are you sure you want to delete " + group.name + "? This will delete all workspaces under this group."))
            return;
        fetch('/api/group/' + gid, JWT.defaultDELETEHeader())
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
                    toast.info('Deleted "' + group.name + '"');
                    navigate('/group');
                    window.location.reload();
                    return;
                }
                console.log(response);
            })
            .catch(error => console.error(error));
    }
}

export default GroupDetails;