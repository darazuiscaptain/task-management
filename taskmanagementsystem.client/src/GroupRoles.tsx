import { useEffect, useState } from 'react';
import './sticky-column-table.css';
import * as JWT from './utils/JWT';
import { useCache } from './utils/Cache';
import { toast } from './Toast';
import {Group,GroupRole,Permission, hasAllPermission,translatePermission } from './types/Types'

interface RoleData {
    id: number;
    name: string;
    isnew: boolean;
    ischanged: boolean;
    isdeleted: boolean;
    permissions: Record<string,boolean>;
}

let _next_temp_id = -1;
function _nextTempId():number {
    return _next_temp_id--;
}

function GroupRoles({ gid,wid }: { gid: number,wid:number }) {

    const [roles, setRoles] = useState<Array<RoleData>>([]);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [changed, setChanged] = useState<boolean>(false);

    const query = wid==0 ? "" : "?wid=" + wid;
    const [group, refreshGroup] = useCache<Group>("group", undefined, gid, query);
    const [permission, refreshPermission] = useCache<Permission>("permission", Permission.View, gid, query);
    const canEdit = hasAllPermission(permission, Permission.GroupRoleManage);

    useEffect(() => {
        processRoles(group);
    }, [group]);

    const contents = group === undefined
        ? <p><em>Loading... </em></p>
        :
        <div className="sticky-column-table">
            <table className="table table-striped" aria-labelledby="tabelLabel">
                <thead>
                    <tr>
                        <th>Permissions</th>
                        {roles.map(r => 
                            !r.isdeleted && <th key={"header" + r.id}>
                                {canEdit&&editMode&&r.id != 0 && <div>
                                    <button onClick={() => editItem(r.id)}>...</button>
                                    <button onClick={() => deleteItem(r.id)}>-</button>
                                </div>}
                                
                                {(r.ischanged ? "*" : " ") + r.name}
                            </th>
                        )}
                        {canEdit&&editMode && <th><button onClick={addItem}>+</button></th>}
                    </tr>
                    
                </thead>
                <tbody>
                    {Object.keys(Permission).filter(k => isNaN(Number(k))).slice(1).map(p =>
                        <tr key={p}>
                            <td>{translatePermission(p)}</td>
                            {roles.map(r =>
                                !r.isdeleted && <td key={p + r.id}>
                                    <input type="checkbox" checked={r.permissions[p]} disabled={!(canEdit&&editMode)} onChange={() => toggleItem(r.id, p)} />
                                </td>
                            )}
                        </tr>
                    )}
            </tbody>
            </table></div>;

    const header = group === undefined ? <></>
        : <div style={{ display: 'flex' }}>
            {canEdit && !editMode && <button style={{ marginLeft: 'auto', marginRight: '0' }} onClick={toggleEdit}>Manage roles</button>}
            {canEdit && editMode && <><button style={{ marginLeft: 'auto', marginRight: '0' }} onClick={cancelEdit}>Cancel</button><button style={{ marginLeft: '8px', marginRight: '0' }} disabled={!changed} onClick={commitEdit}>Update</button></>}
        </div>

    return (
        <div style={{ margin: 'inherit' }}>
            {header}
            {contents}
        </div>
    );


    function newRoleDataFromGroupRole(r: GroupRole) {
        let rd: RoleData = {
            id: r.id,
            name: r.name,
            isnew:false,
            ischanged: false,
            isdeleted:false,
            permissions: {}
        };
        Object.keys(Permission).filter(k => isNaN(Number(k))).slice(1).map(p => {
            rd.permissions[p] = ("" + r.permission) == p || hasAllPermission(r.permission, Permission[p as keyof typeof Permission]);
        })
        return rd;
    }

    function processRoles(data: Group) {
        if (data === undefined)
            return;
        const roles = []
        roles.push(newRoleDataFromGroupRole(data.defaultRole));
        data.roles.forEach(r=>roles.push(newRoleDataFromGroupRole(r)));
        setRoles(roles);
    }

    function toggleItem(rid: number, perm: string) {
        let role = roles.find(r => r.id === rid);
        role.permissions[perm] = !role.permissions[perm];
        role.ischanged = true;
        setRoles([...roles]);
        setChanged(true);
    }

    function editItem(rid: number) {
        let role = roles.find(r => r.id === rid);
        let newname = prompt("Edit name of the role: ", role.name);
        if (newname === null || newname.length==0)
            return;
        role.name = newname;
        role.ischanged = true;
        setRoles([...roles]);
        setChanged(true);
    }

    function addItem() {
        let newname = prompt("Name of the new role: ", "New role");
        if (newname === null || newname.length == 0) {
            alert("Role name cannot be null!");
            return;
        }
        let grole: GroupRole = new GroupRole();
        grole.name = newname;
        grole.permission = Permission.View;
        grole.id = _nextTempId();
        let role: RoleData = newRoleDataFromGroupRole(grole);
        role.isnew = true;
        role.ischanged = true;
        setRoles([...roles, role]);
        setChanged(true);
    }

    function deleteItem(rid: number) {
        let role = roles.find(r => r.id === rid);
        if (!confirm("Are you sure you want to delete this role?"))
            return;
        role.isdeleted = true;
        setRoles([...roles]);
        setChanged(true);
    }

    function toggleEdit() {
        if (!editMode) {
            setChanged(false);
        }
        setEditMode(!editMode);
    }

    function cancelEdit() {
        if (!changed || confirm("Are you sure you want to discard changes?")) {
            toggleEdit();
            processRoles(group);
        }
    }

    async function commitEdit() {
        if (!changed)
            return;
        const promises=[]
        for (var r of roles) {
            if (r.isdeleted) {
                promises.push(fetch('/api/group/' + group.id + '/role/' + r.id + query, JWT.defaultDELETEHeader()));
            }else if (r.isnew) {
                promises.push(fetch('/api/group/' + group.id + '/role/create' + query, JWT.defaultPOSTHeader({
                    name: r.name,
                    permissions: Object.keys(r.permissions).filter(ps => r.permissions[ps])
                })));
            }else if (r.ischanged) {
                promises.push(fetch('/api/group/' + group.id + '/role/' + r.id + '/edit' + query, JWT.defaultPOSTHeader({
                    name: r.name,
                    permissions: Object.keys(r.permissions).filter(ps=>r.permissions[ps])
                })));
            }
                
        }
        const responses = await Promise.all(promises);
        const statusCodes = await Promise.all(responses.map((r: Response) => r.status))
        for (var code of statusCodes) {
            if (code !== 200){
                toast.error("Error updating group users: \n - Session expired");
                return;
            }
        }
        toast.info("Roles updated");
        setEditMode(false);
        refreshPermission();
        refreshGroup();
    }
}

export default GroupRoles;