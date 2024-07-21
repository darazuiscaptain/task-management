import { useEffect, useState } from 'react';
import * as JWT from './utils/JWT';
import { useCache } from './utils/Cache';
import { Group, Permission, hasAllPermission, WorkspaceList } from './types/Types'
import * as Session from './utils/Session';
import { toast } from './Toast';

function GroupWorkspaceList({ gid }: { gid: number }) {

    const [workspaceList, setWorkspaceList] = useState<Record<number, string>>();

    const [userWorkspaceList, refreshUserWorkspaceList] = useCache<WorkspaceList>("workspacelist", undefined, Session.getSession());
    const [group,] = useCache<Group>("group", undefined, gid);
    const [permission,] = useCache<Permission>("permission", Permission.View, gid);

    useEffect(() => {
        getWorkspaceList();
    }, [group]);

    const contents = workspaceList === undefined||userWorkspaceList===undefined
        ? <p><em>Loading... </em></p>
        : <table className="table table-striped" style={{ width:'100%' }}>
        <tbody>
            {Object.keys(workspaceList).map(k => 
                <tr key={k}>
                    <td><p>{workspaceList[k]}</p></td>
                    <td>
                        {(userWorkspaceList.joined.indexOf(Number(k)) < 0 && userWorkspaceList.owned.indexOf(Number(k)) < 0)
                            && <button onClick={() => onJoin(k)}>Join</button>}
                        {(userWorkspaceList.joined.indexOf(Number(k)) >= 0)
                            && <button className='dangerous-button' onClick={() => onLeave(k)}>Leave</button>}
                        {(userWorkspaceList.owned.indexOf(Number(k)) >= 0||hasAllPermission(permission,Permission.GroupWorkspaceManage))
                            && <button className='dangerous-button' onClick={() => onDelete(k)}>Delete</button>}
                    </td>
                </tr>
                )}
                {Object.keys(workspaceList).length==0&&<tr><td>Nothing to show</td></tr> }
            </tbody>
        </table>;


    return (
        <div style={{ margin: 'inherit' }}>
            {contents}
        </div>
    );


    async function getWorkspaceList() {
        fetch('/api/group/' + gid + '/workspaces', JWT.defaultGETHeader())
            .then(response => {
                if (response.status != 200) {
                    toast.error("Cannot load workspace list: \n - You do not have permission to view the group; or \n - Session Expired");
                    return undefined;
                }
                return response.json();
            })
            .then(data => {
                setWorkspaceList(data);
            })
            .catch(error => console.error(error));
    }

    function onJoin(wid) {
        fetch('/api/workspace/' + wid + '/join?gid='+gid, JWT.defaultPOSTHeader())
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot join workspace: \n - Session expired");
                    return;
                }
                if (response.status == 404) {
                    toast.error("Cannot join workspace: \n - The workspace is no longer available");
                    return;
                }
                if (response.status == 200) {
                    toast.info('Joined "' + workspaceList[wid] + '"');
                    refreshUserWorkspaceList();
                    return;
                }
                console.log(response);
            })
            .catch(error => console.error(error));
    }

    function onLeave(wid) {
        if (!confirm("Are you sure you want to leave " + workspaceList[wid] + "?"))
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
                    toast.info('Left "' + workspaceList[wid] + '"');
                    refreshUserWorkspaceList();
                    return;
                }
                console.log(response);
            })
            .catch(error => console.error(error));
    }

    function onDelete(wid) {
        if (!confirm("Are you sure you want to delete " + workspaceList[wid] + "?"))
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
                    toast.info('Deleted "' + workspaceList[wid] + '"');
                    getWorkspaceList();
                    refreshUserWorkspaceList();
                    return;
                }
                console.log(response);
            })
            .catch(error => console.error(error));
    }
}

export default GroupWorkspaceList;