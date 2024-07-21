import { useEffect, useState, ChangeEventHandler } from 'react';
import * as JWT from './utils/JWT';
import * as Session from './utils/Session';
import { Permission, hasAllPermission,  parsePermission } from './types/Types';
import { toast } from './Toast';
import Groupname from './Groupname';

interface GroupIdWithPermission {
    id: number,
    permission:Permission,
}

function GroupSelect({ value, onChange, permission=Permission.View }: {value?:number,onChange?:ChangeEventHandler<HTMLSelectElement>,permission?:Permission}) {

    const [groups, setGroups] = useState<Array<GroupIdWithPermission>>(undefined);

    useEffect(() => {
        getGroups();
    }, []);

    return groups === undefined
        ? <p><em>Loading... </em></p>
        : <>
            {onChange && <select
                name="groupSelect"
                value={value}
                onChange={onChange}
            >
                {getOptions()}
            </select>}
            {!onChange && <select
                name="groupSelect"
                defaultValue={-1}
            >
                {getOptions()}
            </select>}
        </>;

    function getOptions() {
        return <>
            <option value={-1}>No group</option>
            {groups.map(g =>
                hasAllPermission(g.permission, permission) && <option key={g.id} value={g.id}>{<Groupname gid={g.id} />}</option>
            )}
        </>;
    }

    async function getGroups() {
        fetch('/api/user/' + Session.getSession(), JWT.defaultGETHeader())
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot load user data: \n - Session expired");
                    return undefined;
                } else if (response.status == 200) {
                    return response.json();
                }
                return undefined;
            })
            .then(data => {
                if (data === undefined)
                    return;
                getPermissions(data);
            })
            .catch(error => console.error(error));
    }

    async function getPermissions(data) {
        const results:Array<GroupIdWithPermission> = [];
        const promises = []
        for (var id of data.groups) {
            const gid = id;
            promises.push(
                fetch('/api/group/' + gid + '/user/' + Session.getSession() + '/permission', JWT.defaultGETHeader())
                    .then(response => {
                        if (response.status != 200) {
                            toast.error("Error loading user data: \n - Session expired");
                            return undefined;
                        }
                        return response.json();
                    })
                    .then(p => {
                        if (p === undefined)
                            return;
                        results.push({ id: gid, permission: parsePermission(p) });
                    })
                    .catch(error => console.error(error))
            );
        }
        await Promise.all(promises);
        setGroups(results);
    }
}

export default GroupSelect;