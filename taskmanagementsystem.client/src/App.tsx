import './App.css';
import WorkspaceContainer from './Workspace';
import * as JWT from './utils/JWT';
import * as Session from './utils/Session';
import { Navigate } from 'react-router-dom';
import { Permission, WorkspaceList } from './types/Types';
import { toast } from './Toast';
import FoldableContainer from './FoldableContainer';
import { useCache } from './utils/Cache';
import GroupSelect from './GroupSelect';

function App() {
    const [workspaces, refreshWorkspaces] = useCache<WorkspaceList>("workspacelist", undefined, Session.getSession());

    const contents = workspaces === undefined
        ? <p><em>Loading... </em></p>
        : <>
            {workspaces.owned.map(item =>
                <div key={item}><WorkspaceContainer wid={item} /></div>
            )}
            <FoldableContainer title={"Create new workspace"} style={{ backgroundColor: 'white', border: '3px solid #f2f2f2' }}>
                <hr />
                <form method="post" onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input name="name" placeholder="Workspace name" />
                    </label>
                    <label>
                        Description:
                        <input name="description" />
                    </label>
                    <label>
                        Choose a group:
                        <GroupSelect permission={Permission.GroupWorkspaceManage} />
                    </label>
                    <button type="submit">Create</button>
                </form>
                <hr />
            </FoldableContainer>

            {workspaces.joined.map(item =>
                <div key={item}><WorkspaceContainer wid={item} /></div>
            )}
        </>;


    return (
        !JWT.hasJWT() ?
        <Navigate to='/login' replace/>:
            <div>
            <h1>Workspaces</h1>
            {contents}
        </div>
    );

    function handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const formObject = {
            name: formData.get("name").toString(),
            description: formData.get("description").toString(),
            groupOwnerId: Number(formData.get("groupSelect").toString()),
        };
        if (formObject.name === null || formObject.name.length == 0) {
            toast.warning("Workspace name cannot be empty!");
            return;
        }
        fetch('/api/workspace/create', JWT.defaultPOSTHeader(formObject))
            .then(response => {
                if (response.status == 401) {
                    toast.error("Cannot create workspace: \n - Session Expired");
                    return;
                }
                toast.info('"' + formObject.name + '" created');
                e.target.reset();
                refreshWorkspaces();
            })
            .catch(error => console.error(error));
    }
}

export default App;