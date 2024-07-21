import { DragEvent, MutableRefObject, forwardRef, CSSProperties } from 'react';

function DraggableElementContainer({ id, style, children, testDragOver, onDrop }: { id: string, style?: CSSProperties, children: any, testDragOver?: (id, pid) => boolean, onDrop?: (id, pid) => void }) {

    return <div
        id={id}
        onDragOver={onDragOverWrapper}
        onDrop={onDropWrapper}
        style={{
            ...style,
            border: "1px solid",
            borderColor: "black",
            borderRadius: "5px"
        }}
    >
        {children}
    </div>;

    function onDragOverWrapper(ev: DragEvent) {
        if (testDragOver)
            testDragOver(ev.currentTarget.id, ev.currentTarget.parentElement.id) && ev.preventDefault();
        else
            ev.preventDefault();
    }
    function onDropWrapper(ev: DragEvent) {
        if (onDrop)
            onDrop(ev.currentTarget.id, ev.currentTarget.parentElement.id);
    }
}

const DraggableElement = forwardRef(_DraggableElement)

function _DraggableElement({ id, style, children, testDragOver, onDrop }: { id: string, style?:CSSProperties, children: any, testDragOver?: (id, pid) => boolean, onDrop?: (id, pid) => void }, ref:  MutableRefObject<string>) {

    return <div
            draggable={true}
            id={id}
            onDragOver={onDragOverWrapper}
            onDragStart={onDragStartWrapper}
            onDrop={onDropWrapper}
            style={{
                border: "1px solid",
                borderColor: "black",
                borderRadius: "5px",
                ...style
            }}
        >
            {children}
    </div>;

    function onDragOverWrapper(ev: DragEvent) {
        if(testDragOver)
            testDragOver(ev.currentTarget.id,ev.currentTarget.parentElement.id) && ev.preventDefault();
    }
    function onDragStartWrapper() {
        ref.current = id;
    }
    function onDropWrapper(ev: DragEvent) {
        if (onDrop)
            onDrop(ev.currentTarget.id, ev.currentTarget.parentElement.id);
    }
}

export {DraggableElement,DraggableElementContainer };