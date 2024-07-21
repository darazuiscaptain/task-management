import { useEffect, useState } from 'react';
import * as JWT from './JWT'
import { toast } from './../Toast';
import { Workspace, Group, Permission, parsePermission, WorkspaceList } from './../types/Types';
import * as Session from './Session';

class CacheModel<K extends string | number,V> {
    id: Readonly<string>;
    defaultValue: Readonly<V>;
    private _cache: Record<K, V>;
    private _fetchCallbacks: Record<K, Array<Function>>;
    private _fetch_func: (id: K, query: string) => Promise<Response>;
    private _resolve_func: (response: Response) => Promise<V>;
    private _error_func: (status: number) => void;

    constructor(id: string, defaultValue: V,
        _fetch_func: (id: K, query:string) => Promise<Response>,
        _resolve_func: (response: Response) => Promise<V>,
        _error_func: (status: number) => void) {
        this.id = id;
        this.defaultValue = defaultValue;
        this._fetch_func = _fetch_func;
        this._resolve_func = _resolve_func;
        this._error_func = _error_func;
        this._cache = {} as Record<K, V>;
        this._fetchCallbacks = {} as Record<K, Array<Function>>;
    }

    get(key: K,query:string, onReceive: (value: V) => void|Function): V {
        if (this._cache[key] === undefined) {
            this._cache[key] = null;
            this._fetchCallbacks[key] = [];
            this._fetchCallbacks[key].push(onReceive);
            this.fetch(key,query)
                .catch(error => { console.error(error); toast.error("An error occurred when fetching data from server", "cache_fetch_error"); });
        } else if (this._cache[key] === null) {
            this._fetchCallbacks[key].push(onReceive);
        } else {
            this._fetchCallbacks[key].push(onReceive);
            return this._cache[key];
        }
        return this.defaultValue;
    }

    async fetch(key: K,query:string): Promise<V> {
        return this._fetch_func(key,query)
            .then(response => {
                if (response.status == 200)
                    return this._resolve_func(response);
                this._error_func(response.status);
                return this.defaultValue;
            })
            .then(data => {
                this._cache[key] = data;
                if (this._fetchCallbacks[key] !== undefined)
                    this._fetchCallbacks[key] = this._fetchCallbacks[key].map(callback => callback(data)).filter(ret => ret !== undefined && ret !== null);
                return data;
            })
    }

    invalidate(key: K) {
        this._cache[key] = undefined;
    }

    invalidateAll() {
        this._cache = {} as Record<K, V>;
        this._fetchCallbacks = {} as Record<K, Array<Function>>;
    }
}



async function fetchUsername(id:number) {
    return fetch('/api/user/' + id + "/public/username", JWT.defaultGETHeader())
}

async function fetchGroup(id: number, query: string) {
    if (query === null || query === undefined)
        query = "";
    return fetch('/api/group/' + id+query, JWT.defaultGETHeader())
}

async function fetchPermission(id: number, query: string) {
    if (query === null || query === undefined)
        query = "";
    return fetch('/api/group/' + id + '/user/' + Session.getSession() + '/permission' + query, JWT.defaultGETHeader());
}

async function fetchWorkspace(id: number) {
    return fetch('/api/workspace/' + id, JWT.defaultGETHeader())
}

async function fetchUserWorkspace(id: number) {
    return fetch('/api/user/' + id+'/workspaces', JWT.defaultGETHeader())
}

async function resolveAsText(response: Response) {
    return response.text();
}
async function resolveAsJson(response: Response) {
    return response.json();
}
async function resolveAsPermission(response: Response) {
    let p = await response.json();
    return parsePermission(p);
}

function errorUsername(status: number) {
    if (status === 404)
        toast.warning("Error fetching username: \n - User not found", "username_fetch_error")
}

function errorGroup(status: number) {
    if (status === 401)
        toast.error("Error fetching group data: \n - You do not have view permission for this group; or \n - Your session has expired", "group_fetch_error")
    if (status === 404)
        toast.error("Error fetching group data: \n - Group not found", "group_fetch_error")
}

function errorPermission(status: number) {
    if (status === 401)
        toast.error("Error fetching permission data: \n - Session expired", "permission_fetch_error")
}

function errorWorkspace(status: number) {
    if (status === 401)
        toast.error("Error fetching workspace data: \n - Session expired", "workspace_fetch_error")
}


const UsernameCache: CacheModel<number, string> = new CacheModel(
    "username", "...", fetchUsername, resolveAsText, errorUsername
);

const GroupCache: CacheModel<number, Group> = new CacheModel(
    "group", undefined, fetchGroup, resolveAsJson, errorGroup
);

const PermissionCache: CacheModel<number, Permission> = new CacheModel(
    "permission", Permission.View as number, fetchPermission, resolveAsPermission, errorPermission
);

const WorkspaceCache: CacheModel<number, Workspace> = new CacheModel(
    "workspace", undefined, fetchWorkspace, resolveAsJson, errorWorkspace
);

const UserWorkspaceCache: CacheModel<number, WorkspaceList> = new CacheModel(
    "userworkspace", undefined, fetchUserWorkspace, resolveAsJson, errorWorkspace
);

function useCache<T>(type: 'username'|'group'|'permission'|'workspace'|'workspacelist',defaultValue:T,key:number,query?:string):[T,()=>void] {
    let cache = type == 'username' ? UsernameCache : type == 'group' ? GroupCache : type == 'permission' ? PermissionCache : type == 'workspace' ? WorkspaceCache : type == 'workspacelist' ? UserWorkspaceCache : undefined;
    const [val, setVal] = useState<T>(defaultValue);
    const refreshVal = () => {
        cache.fetch(key, query)
            .then(data=>setVal(data))
            .catch(error => {
                console.error(error); toast.error("An error occurred when fetching data from server", "cache_fetch_error");
            });
    };
    useEffect(() => {
        let stop = false;
        const callbackVal = (v) => { setVal(v); return stop ? undefined : callbackVal; };
        setVal(cache.get(key, query, callbackVal) as T);
        return () => { stop = true };
    },[]);
    return [val, refreshVal];
}

function useCacheInvalidation<T>(type: 'username' | 'group' | 'permission' | 'workspace' | 'workspacelist', key: number): () => void {
    let cache = type == 'username' ? UsernameCache : type == 'group' ? GroupCache : type == 'permission' ? PermissionCache : type == 'workspace' ? WorkspaceCache : type == 'workspacelist' ? UserWorkspaceCache : undefined;
    const invalidateVal = () => {
        cache.invalidate(key);
    };
    return invalidateVal;
}

function invalidateCaches() {
    UsernameCache.invalidateAll();
    GroupCache.invalidateAll();
    PermissionCache.invalidateAll();
    WorkspaceCache.invalidateAll();
    UserWorkspaceCache.invalidateAll();
}

export { useCache, useCacheInvalidation, invalidateCaches }