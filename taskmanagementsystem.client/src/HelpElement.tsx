import './HelpElement.css';

function HelpElement({ text, children }: { text: any, children: any }) {

    return <div className="help-element">
        {children}
        <div className="help-handle">?<div className="help-box">{text}</div></div>
    </div>;
}

export default HelpElement;