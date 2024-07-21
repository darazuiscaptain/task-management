import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import * as JWT from './utils/JWT';
import { getSession } from './utils/Session';
import { DateTime } from './utils/Utils';
import Username from './Username'
import './TodoDetails.css';
import { toast } from './Toast'
import { Workspace, Permission, hasAllPermission, TodoItem, EditHistory, EditActions, UserList } from './types/Types';
import { useCache } from './utils/Cache';

function AssignComponent({ tid, wid, callback }: { tid: number, wid: number, callback: (uid:number)=>void }) {

    const [groupSelect, setGroupSelect] = useState<number>(-1);
    const [roleSelect, setRoleSelect] = useState<number>(-1);
    const [userSelect, setUserSelect] = useState<number>(-1);

    const [workspace, ] = useCache<Workspace>("workspace", undefined, wid);
    const [defaultGroupUserList, setDefaultGroupUserList] = useState<UserList>(undefined);
    const [groupUserList, setGroupUserList] = useState<UserList>(undefined);

    useEffect(() => {
        if (workspace === undefined)
            return;
        fetch('/api/group/' + workspace.defaultGroupId + '/user/list?wid=' + wid, JWT.defaultGETHeader())
            .then(response => response.json())
            .then(data => {
                setDefaultGroupUserList(data);
            })
            .catch(error => console.error(error));
        if (workspace.groupOwnerId > 0) {
            fetch('/api/group/' + workspace.groupOwnerId + '/user/list?wid=' + wid, JWT.defaultGETHeader())
                .then(response => response.json())
                .then(data => {
                    setGroupUserList(data);
                })
                .catch(error => console.error(error));
        }
    }, [workspace]);

    const contents = defaultGroupUserList === undefined || workspace.groupOwnerId>0&&groupUserList === undefined
        ? <p>Loading...</p>
        : <div>
            <div>
                <select
                    value={groupSelect}
                    onChange={e => { setGroupSelect(Number(e.currentTarget.value)); setUserSelect(-1); setRoleSelect(-1); }}
                >
                    <option value={-1}>Select a group</option>
                    <option value={1}>Workspace default group</option>
                    {workspace.groupOwnerId > 0 && <option value={2}>Workspace owner group</option>}
                </select>
            </div>
            <div>
                <select
                    value={roleSelect}
                    onChange={e => { setRoleSelect(Number(e.currentTarget.value)); setUserSelect(-1); }}
                >
                    <option value={-1}>Select a role</option>
                    {listRoleOptions()}
                </select>
            </div>
            <div>
                <select
                    value={userSelect}
                    onChange={e => setUserSelect(Number(e.currentTarget.value))}
                >
                    <option value={-1}>Select a user</option>
                    {listUserOptions()}
                </select>
            </div>
            
            <button onClick={onAssign} disabled={userSelect<0 }>Assign</button>
        </div>

    return contents;

    function listRoleOptions() {
        if (groupSelect == -1)
            return <></>;
        let userList = groupSelect == 1 ? defaultGroupUserList : groupUserList;
        return <>
            <option value={-2}>Owner</option>
            {Object.keys(userList.roles).map(rid => 
            <option key={groupSelect + "." + rid} value={Number(rid)}>{userList.roles[rid]}</option>
        )}</>
    }

    function listUserOptions() {
        if (groupSelect == -1||roleSelect==-1)
            return <></>;
        let userList = groupSelect == 1 ? defaultGroupUserList : groupUserList;
        return <>{roleSelect == -2
            ? <option value={0}><Username uid={groupSelect==1?workspace.ownerId:userList.ownerId} plaintext /></option>
            :userList.members[roleSelect + ""].map(uid =>
            <option key={groupSelect + "." + roleSelect + "." + uid} value={Number(uid)}><Username uid={uid} plaintext /></option>
        )}</>
    }

    function onAssign() {
        let val = userSelect > 0 ? userSelect : groupSelect == 1 ? workspace.ownerId : groupUserList.ownerId;
        fetch('/api/todolist/' + tid + '/assign', JWT.defaultPOSTHeader(val))
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot assign: \n - Session Expired");
                    return;
                } else if (response.status == 404) {
                    toast.error("Cannot assign: \n - The item or user you are looking for is no longer available");
                    return;
                }
                if (response.status == 200) {
                    toast.info("Task assigned");
                    callback(val);
                    return;
                }
                console.log(response);
            })
            .catch(error => console.error(error));
    }
}

function TodoDetails({ item, gid, wid, callback }: {item:TodoItem,gid:number,wid:number,callback:Function}) {

    const [history, setHistory] = useState<Array<EditHistory>>(undefined);
    const [editMode, setEditMode] = useState(false);
    const [assignMode, setAssignMode] = useState(false);
    const [title, setTitle] = useState(item.title);
    const [description, setDescription] = useState(item.description);

    const [permission, ] = useCache<Permission>("permission", Permission.View, gid,"?wid=" + wid);

    useEffect(() => {
        getHistory();
    }, []);

    const contents =
        <div id="detail-panel-inner">
            {editMode ?
                <div>
                    <input value={title} onInput={e => setTitle(e.currentTarget.value)} />
                    <textarea value={description} onInput={e => setDescription(e.currentTarget.value)} />
                    <div>
                        <button onClick={editItem}>Save</button>
                        <button onClick={() => {
                            setTitle(item.title);
                            setDescription(item.description);
                            setEditMode(false);
                        }}>Cancel</button>
                    </div>
                </div> :
                <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {!(item.isDeleted || item.isArchived) && (hasAllPermission(permission, Permission.Edit) || item.ownerId == getSession() && hasAllPermission(permission, Permission.EditSelf) || item.assigneeId == getSession() && hasAllPermission(permission, Permission.EditAssigned))
                        && <button onClick={() => setEditMode(!editMode)}>Edit</button>}
                </div>
            }
            <br></br>
            <p>{DateTime(item.createdTimestamp)}</p>
            <p>Created by: <Username uid={item.ownerId}></Username></p>
            <div>
                <p>Assigned to: {item.assigneeId < 0 ? "Not assigned" : <Username uid={item.assigneeId}></Username>}</p>
                {!(item.isDeleted || item.isArchived) && (hasAllPermission(permission, Permission.Claim) || item.ownerId == getSession() && hasAllPermission(permission, Permission.ClaimSelf))
                    && item.assigneeId <= 0
                    && <button onClick={claimItem}>Claim task</button>
                }
                {!(item.isDeleted || item.isArchived) && (hasAllPermission(permission, Permission.Assign) || item.ownerId == getSession() && hasAllPermission(permission, Permission.AssignSelf))
                    && <>
                        <button onClick={() => setAssignMode(!assignMode)}>{assignMode ? "Cancel" : "Change assignment"}</button>
                        {assignMode && <AssignComponent tid={item.id} wid={wid} callback={assignItemCallback} />}
                    </>
                }
            </div>
            <p>Status: <input type="checkbox" checked={item.isCompleted} onChange={toggleItem} disabled={
                item.isDeleted || item.isArchived ||
                !(hasAllPermission(permission, Permission.Toggle) || item.ownerId == getSession() && hasAllPermission(permission, Permission.ToggleSelf) || item.assigneeId == getSession() && hasAllPermission(permission, Permission.ToggleAssigned))
            } />
            </p>
            {history === undefined ?
                <p>Loading edit history...</p> :
                <div>{history.map(hist =>
                    <p key={hist.timestamp + "" + hist.action}>{DateTime(hist.timestamp)} <Username uid={hist.ownerId} /> {translateAction(hist)}</p>
                )}
                </div>
            }
            {!(item.isDeleted || item.isArchived) && (hasAllPermission(permission, Permission.Archive) || hasAllPermission(permission, Permission.ArchiveSelf) && item.ownerId == getSession())
                && <button onClick={() => archiveItem(item)}>Archive</button>
            }
            {!item.isDeleted && (hasAllPermission(permission, Permission.Delete) || hasAllPermission(permission, Permission.DeleteSelf) && item.ownerId == getSession())
                && <button onClick={deleteItem}>Delete</button>
            }
        </div>;



    return (
        createPortal(
            <div id="detail-panel">
                <button onClick={() => callback(null)}>Close</button>
                {contents}
            </div>
            , document.body)
    );

    async function getHistory() {
        fetch('/api/todolist/' + item.id + "/history", JWT.defaultGETHeader())
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot load edit history: \n - Session Expired", "todo_load_history");
                    return undefined;
                } else if (response.status == 404) {
                    toast.error("The item you are looking for is no longer available", "todo_load_history");
                    return;
                }
                return response.json()
            })
            .then(data => {
                if (data === undefined)
                    return;
                setHistory(data.reverse())
            })
            .catch(error => console.error(error));
    }

    function editItem() {
        if (!item.isDeleted) {
            if (title.length > 0) {
                fetch('/api/todolist/' + item.id + '/edit', JWT.defaultPOSTHeader({
                    title: title,
                    description: description
                }))
                    .then(response => {
                        if (response.status == 401) {
                            toast.error("Cannot edit task: \n - Session Expired");
                            return;
                        } else if (response.status == 404) {
                            toast.error("Cannot edit task: \n - The item you are looking for is no longer available");
                            return;
                        }
                        toast.info("Task info updated");
                        item.title = title;
                        item.description = description;
                        callback(item);
                        setEditMode(false);
                        getHistory();
                    })
                    .catch(error => console.error(error));
            } else {
                alert("Title cannot be empty!");
            }
        }
    }

    function toggleItem() {
        if (!item.isDeleted) {
            fetch('/api/todolist/' + item.id + '/toggle', JWT.defaultPOSTHeader())
                .then(response => {
                    if (response.status == 401) {
                        toast.error("Cannot toggle completion: \n - Session Expired");
                        return;
                    } else if (response.status == 404) {
                        toast.error("Cannot toggle completion: \n - The item you are looking for is no longer available");
                        return;
                    }
                    item.isCompleted = !item.isCompleted;
                    callback(item);
                    getHistory();
                })
                .catch(error => console.error(error));
        }
    }

    function claimItem() {
        if (!item.isDeleted) {
            fetch('/api/todolist/' + item.id + '/claim', JWT.defaultPOSTHeader())
                .then(response => {
                    if (response.status == 401) {
                        toast.error("Cannot claim task: \n - Session Expired");
                        return;
                    } else if (response.status == 404) {
                        toast.error("Cannot claim task: \n - The item you are looking for is no longer available");
                        return;
                    }
                    item.assigneeId = getSession();
                    callback(item);
                    getHistory();
                })
                .catch(error => console.error(error));
        }
    }

    function assignItemCallback(assignee: number) {
        item.assigneeId = assignee;
        callback(item);
        getHistory();
    }

    function archiveItem(item: TodoItem) {
        if (!item.isDeleted && !item.isArchived) {
            if (!confirm("Are you sure you want to make this item read-only?"))
                return;
            fetch('/api/todolist/' + item.id + '/archive', JWT.defaultPOSTHeader())
                .then(response => {
                    if (response.status == 401) {
                        toast.error("Cannot archive: \n - Session Expired");
                        return;
                    } else if (response.status == 404) {
                        toast.error("Cannot archive: \n - The item you are looking for is no longer available");
                        return;
                    }
                    toast.info('"' + item.title + '" archived');
                    item.isArchived = true;
                    callback(item);
                    getHistory();
                })
                .catch(error => console.error(error));
        }
    }

    function deleteItem() {
        if (!item.isDeleted) {
            if (!confirm("Are you sure you want to delete this todo item?"))
                return;
            fetch('/api/todolist/' + item.id, JWT.defaultDELETEHeader())
                .then(response => {
                    if (response.status == 401) {
                        toast.error("Cannot delete: \n - Session Expired");
                        return;
                    } else if (response.status == 404) {
                        toast.error("Cannot delete: \n - The item you are looking for is no longer available");
                        return;
                    }
                    toast.info('"'+item.title+'" deleted');
                    item.isDeleted = true;
                    if (hasAllPermission(permission, Permission.WorkspaceViewDeletedItem)) {
                        callback(item);
                        getHistory();
                    } else {
                        callback(null);
                    }
                })
                .catch(error => console.error(error));
        }
    }

    function translateAction(hist: EditHistory) {
        let action = EditActions[hist.action as unknown as keyof typeof EditActions]
        switch (action) {
            case EditActions.Create: return "created this task";
            case EditActions.NameOrTitle: return "edited title to "+hist.data;
            case EditActions.Description: return "edited description to "+hist.data;
            case EditActions.Delete: return "deleted this task";
            case EditActions.CheckTodo: return "marked this as completed";
            case EditActions.UncheckTodo: return "marked this as not completed";
            case EditActions.Assign: return <>{"assigned this task to "}<Username uid={Number(hist.data)} /></>;
            case EditActions.Claim: return "claimed this task";
            case EditActions.Archive: return "archived this task";
        }
        return "modified this task";
    }

}

export default TodoDetails;