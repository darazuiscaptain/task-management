import { useCache } from './utils/Cache';

function Username({ uid, plaintext=false }: {uid:number, plaintext?:boolean}) {

    const [username,_] = useCache<string>("username","...",uid);

    return (
        plaintext
            ? <>{username}</>
            :<label>{username}</label>
    );

}

export default Username;