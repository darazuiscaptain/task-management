import { Dispatch, Fragment, useState } from 'react';
import './App.css';
import './sticky-column-table.css';

enum ToastType {
    Info,
    Warning,
    Error,
}

interface ToastMessage {
    id: number;
    content: string,
    type:number,
    category?:string,
    timeCreated: number;
}

let toasts: Array<ToastMessage> = [];
let listener: Dispatch<Array<ToastMessage>>;
let next_toast_id = 0;

class _Toast {
    _toast(s: string, type:ToastType, category: string, timeout: number) {
        if (category !== undefined && toasts.filter(t => t.category === category).length > 0)
            return;
        let t: ToastMessage = { id: next_toast_id++, content: s, type:type, category: category, timeCreated: Date.now() };
        toasts.push(t);
        listener([...toasts]);
        setTimeout(() => {
            toasts = toasts.filter(toast => toast != t)
            listener([...toasts])
        }, timeout || 5000)
    }

    info(s: string, category?: string, timeout?: number) {
        this._toast(s, ToastType.Info, category, timeout);
    }
    warning(s: string, category?: string, timeout?: number) {
        this._toast(s, ToastType.Warning, category, timeout);
    }
    error(s: string, category?: string, timeout?: number) {
        this._toast(s, ToastType.Error, category, timeout);
    }
}

const toast = new _Toast();

function _getColor(type: ToastType) {
    switch (type) {
        case ToastType.Info: return 'green';
        case ToastType.Warning: return 'orange';
        case ToastType.Error: return 'red';
    }
}

function Toast() {

    const [toastList, setToastList] = useState<Array<ToastMessage>>(toasts);
    listener = setToastList;

    return (
        <div style={{
            position: 'fixed',
            zIndex: '9999',
            display: 'flex',
            top: '2em',
            right: '2em',
            maxWidth:'50%',
            flexDirection: 'column-reverse'
        }}>
            {toastList.map(t =>
                <button style={{ borderColor: _getColor(t.type), marginLeft: 'auto', marginRight: '0', marginBottom: '1em' }} key={t.id}>
                    {t.content.split('\n').map(s => <Fragment key={s}>{s}<br /></Fragment>)}
                </button>)}
            
        </div>
    );
}

export { Toast,toast };