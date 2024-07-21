import { useEffect, useState } from 'react';
import * as JWT from './utils/JWT';
import FoldableContainer from './FoldableContainer';
import GroupDetails from './GroupDetails'
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from './Toast';
import { getSession } from './utils/Session';

function GroupList() {

    const [groups, setGroups] = useState<Array<number>>(undefined);

    const navigate = useNavigate();
    const [params,] = useSearchParams();

    const gid = Number(params.get("gid"));
    const wid = Number(params.get("wid"));

    useEffect(() => {
        getGroups();
    }, []);

    const contents = gid != 0 
        ?<div>
                <GroupDetails gid={gid} wid={wid} hideFoldableBanner />
            
        </div>
        : groups === undefined 
        ?<p>Loading...</p>
        :<div>
                {groups.map(gid =>
                    <GroupDetails key={gid} gid={gid} />
                )}
                <FoldableContainer title={"Create new group"} style={{ backgroundColor: 'white', border: '3px solid #f2f2f2' }}>
                    <hr />
                    <form method="post" onSubmit={handleSubmit}>
                        <label>
                            Name:
                            <input name="name" placeholder="Group name" />
                        </label>
                        <label>
                            Description:
                            <input name="description" />
                        </label>
                        <button type="submit">Create</button>
                    </form>
                    <hr />
                </FoldableContainer>
            
        </div>

    const header = gid == 0
        ? <h1>Groups</h1>
        : <div style={{ margin:'1em',display:'flex',flexDirection:'row-reverse' } }>
            {wid != 0
            ? <button onClick={onWorkspaceButton}>Back to workspaces</button>
                : <button onClick={onGroupButton}>Back to groups</button>}
        </div>

    return (
        <div>
            {header}
            {contents}
        </div>
    );

    async function getGroups() {
        fetch('/api/user/' + getSession(), JWT.defaultGETHeader())
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
                setGroups(data.groups);
            })
            .catch(error => console.error(error));
    }

    function handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const formObject = {
            ownerId: getSession(),
            name: formData.get("name").toString(),
            description: formData.get("description").toString(),
        };
        if (formObject.name === null || formObject.name.length == 0) {
            toast.warning("Group name cannot be empty!");
            return;
        }
        fetch('/api/group/create', JWT.defaultPOSTHeader(formObject))
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot create group: \n - Session Expired");
                    return;
                }
                toast.info('"' + formObject.name + '" created');
                e.target.reset();
                getGroups();
            })
            .catch(error => console.error(error));
    }

    function onWorkspaceButton() {
        navigate('/home');
    }

    function onGroupButton() {
        navigate('/group');
    }
}

export default GroupList;