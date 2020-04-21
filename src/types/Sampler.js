import React, {useState, useMemo, useEffect} from 'react';
import {humanFriendlyPercentage} from '../util'
import withHoverDetection from '../hoc/withHoverDetection'
import classnames from 'classnames'

export function Sampler({ data }) {
    const { threads } = data
    return <div id="sampler">
        <div id="stack">
            {threads.map(thread => <BaseNode parents={[]} node={thread} key={thread.name} />)}
        </div>
    </div>
}

const NodeInfo = withHoverDetection(({ hovered, children, time, threadTime, onHoverChanged, toggleExpand }) => {
    useEffect(() => onHoverChanged(hovered), [onHoverChanged, hovered])
    return <div onClick={toggleExpand}>
        {children}
        <span className="percent">{humanFriendlyPercentage(time / threadTime)}</span>
        <span className="time">{time}ms</span>
        <span className="bar">
            <span className="bar-inner" style={{
                width: humanFriendlyPercentage(time / threadTime)
            }} />
        </span>
    </div>
})

// We use React.memo to avoid re-renders. This is because the trees we work with are really deep.
const BaseNode = React.memo(({ parents, node }) => {
    const [ expanded, setExpanded ] = useState(node.children.length <= 1)
    const [ hovered, setHovered ] = useState(false)
    const classNames = classnames({
        'node': true,
        'collapsed': !expanded,
        'parent': parents.length === 0
    })
    const nodeInfoClassNames = 'name'
    const basicName = node.name ? node.name : node.className + "." + node.methodName + "()"
    const parentsForChildren = useMemo(() => parents.concat([ node ]), [parents, node])
    const parentTime = parents.length === 0 ? node.time : parents[0].time

    function toggleExpand() {
        setExpanded(!expanded)
    }
    
    function onHoverChanged(newHover) {
        if (hovered !== newHover) {
            setHovered(newHover)
        }
    }

    return <li className={classNames}>
        <div className={nodeInfoClassNames}>
            <NodeInfo time={node.time} threadTime={parentTime} toggleExpand={toggleExpand} onHoverChanged={onHoverChanged}>
                {basicName}
            </NodeInfo>
        </div>
        {expanded ? <ul className="children">
            {node.children.map((node, i) => <BaseNode node={node} parents={parentsForChildren} key={i} />)}
        </ul> : null}
    </li>
})

const Name = ({ name }) => {
    const methodPackageSeparatorIdx = name.lastIndexOf('.')
    if (methodPackageSeparatorIdx === -1) {
        return <>{name}</>
    }
    const method = name.substring(methodPackageSeparatorIdx + 1)
    const qualifiedClassName = name.substring(0, methodPackageSeparatorIdx)

    let className
    const classNameFromPackageSeparator = qualifiedClassName.lastIndexOf('.')
    if (classNameFromPackageSeparator === -1) {
        className = qualifiedClassName
    } else {
        className = qualifiedClassName.substring(classNameFromPackageSeparator + 1)
    }

    const packageName = qualifiedClassName.substring(0, Math.max(0, qualifiedClassName.lastIndexOf('.')))
    let lambda

    // if we need to include the lambda part
    const lambdaIdx = className.indexOf("$$Lambda");
    if (lambdaIdx !== -1) {
        lambda = className.substring(lambdaIdx)
        className = className.substring(0, lambdaIdx)
    }

    return <>
        <span className="package-part">{packageName ? packageName + "." : ""}</span>
        <span className="class-part">{className}</span>
        {lambda ? <span className="lambdadesc-part">{lambda}</span> : null}
        .
        <span className="method-part">{method}</span>
    </>
}