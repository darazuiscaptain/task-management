import { CSSProperties, useState } from 'react';
import './FoldableContainer.css';

function FoldableContainer({ title, style, children }: { title: string, style?:CSSProperties, children: any }) {

    const [folded, setFolded] = useState(true);

    return (
        <div>
            <div className="foldable-banner" style={style}>
                <label>{title}</label>
                <button onClick={toggleFolded}>{folded ? "+" : "-"}</button>
            </div>
            <div className="foldable-content" style={{ display: folded ? 'none' : 'contents' }}>{children}</div>
        </div>
    );

    function toggleFolded() {
        setFolded(!folded);
    }
}

export default FoldableContainer;