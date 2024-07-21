import { Group } from './types/Types';
import { useCache } from './utils/Cache';

function Groupname({ gid }: { gid: number }) {
    const [group,] = useCache<Group>("group", undefined, gid);
    return <>{group === undefined ? "..." : group.name}</>
}

export default Groupname;