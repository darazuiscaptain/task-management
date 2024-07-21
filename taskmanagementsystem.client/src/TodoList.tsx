import { useEffect, useState } from 'react';
import * as JWT from './utils/JWT';
import { getSession } from './utils/Session';
import { DateTime } from './utils/Utils';
import TodoDetails from './TodoDetails';
import { useCache } from './utils/Cache';
import { Permission, hasAllPermission, TodoItem } from './types/Types';
import Username from './Username';
import { toast } from './Toast';

function TodoList({ wid, gid }: {wid:number,gid:number}) {

    const [todoList, setTodoList] = useState<Array<TodoItem>>(undefined);
    const [input, setInput] = useState("");

    const [currentItem, setCurrentItem] = useState<TodoItem>(null);
    const [refresh, setRefresh] = useState(true);

    const [permission, ] = useCache<Permission>("permission", Permission.View, gid, "?wid=" + wid);

    useEffect(() => {
        getTodoList();
    }, []);

    const contents = todoList === undefined
        ? <p><em>Loading... </em></p>
        : <table className="table table-striped" style={{ margin: 'auto' }}>
            <thead>
                <tr>
                    <th>Task <button onClick={refreshList}>Refresh</button></th>
                    <th>Assigned to</th>
                    <th>Added</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {todoList.map(item =>
                    <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.assigneeId > 0 ? <Username uid={item.assigneeId} /> : ""}</td>
                        <td>{DateTime(item.createdTimestamp)}</td>
                        <td>
                            {item.isDeleted && "Deleted, "}
                            {item.isArchived && "Archived, "}
                            <input type="checkbox" checked={item.isCompleted} onChange={() => toggleItem(item)}
                                disabled={
                                    item.isArchived || item.isDeleted ||
                                    !(hasAllPermission(permission, Permission.Toggle) || item.ownerId == getSession() && hasAllPermission(permission, Permission.ToggleSelf) || item.assigneeId == getSession() && hasAllPermission(permission, Permission.ToggleAssigned))
                                }
                            />
                        </td>
                        <td>
                            <button onClick={() => setCurrentItem(item)}>Details</button>
                            {!(item.isDeleted || item.isArchived) && (hasAllPermission(permission, Permission.Archive) || hasAllPermission(permission, Permission.ArchiveSelf) && item.ownerId == getSession())
                                && <button onClick={() => archiveItem(item)}>Archive</button>}
                            {!item.isDeleted && (hasAllPermission(permission, Permission.Delete) || hasAllPermission(permission, Permission.DeleteSelf) && item.ownerId == getSession())
                                && <button onClick={() => deleteItem(item)}>Delete</button>}
                        </td>
                    </tr>
                )}
                <tr>
                    <td><input value={input} onInput={e => setInput(e.currentTarget.value)} /></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td><button onClick={addItem}>Add</button></td>
                </tr>
            </tbody>
        </table>;


    return (
            <div>
            {contents}
            {currentItem !== null && <TodoDetails item={currentItem} wid={wid} gid={gid} callback={itemCallback} />}
            </div>
    );

    function itemCallback(newitem:TodoItem) {
        setRefresh(!refresh);
        setCurrentItem(newitem);
    }

    async function getTodoList() {
        return fetch('/api/workspace/'+wid+"/todolist", JWT.defaultGETHeader())
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot load task list: \n - Session Expired");
                    return undefined;
                } else if (response.status == 404) {
                    toast.error("Cannot load task list: \n - The workspace is no longer available");
                    return undefined;
                }
                return response.json();
            })
            .then(data => {
                setTodoList(data);
                return data;
            })
            .catch(error => console.error(error));
    }

    function refreshList() {
        getTodoList().then(data => {
            if (data !== undefined)
                toast.info("Task list refreshed");
        })
    }

    function archiveItem(item:TodoItem) {
        if (!item.isDeleted&&!item.isArchived) {
            if (!confirm("Are you sure you want to make this item read-only?"))
                return;
            fetch('/api/todolist/' + item.id+'/archive', JWT.defaultPOSTHeader())
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
                    setTodoList([...todoList]);
                })
                .catch(error => console.error(error));
        }
    }

    function deleteItem(item:TodoItem) {
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
                    toast.info('"' + item.title + '" deleted');
                    item.isDeleted = true;
                    let newList = hasAllPermission(permission, Permission.WorkspaceViewDeletedItem) ? [...todoList] : todoList.filter(item => !item.isDeleted);
                    setTodoList(newList);
                })
                .catch(error => console.error(error));
        }
    }

    function toggleItem(item:TodoItem) {
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
                    setTodoList([...todoList]);
                })
                .catch(error => console.error(error));
        }
    }

    function addItem() {
        if (input.length > 0) {
            fetch('/api/todolist/create', JWT.defaultPOSTHeader({
                ownerId: getSession(),
                title: input,
                description: "",
                workspaceId: wid
            }))
                .then(response => {
                    if (response.status == 401) {
                        toast.error("Cannot create task: \n - Session Expired");
                        return;
                    } else if (response.status == 400) {
                        toast.error("Cannot create task: \n - The workspace is no longer available");
                        return;
                    }
                    setInput("");
                    getTodoList().then(data => {
                        if (data !== undefined)
                            toast.info("New task added");
                    })
                })
                .catch(error => console.error(error));
        }
        else {
            toast.warning("New task must have a title!");
        }
    }

}

export default TodoList;