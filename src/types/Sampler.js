import React from 'react';
import {FixedSizeTree as Tree} from 'react-vtree';
import AutoSizer from 'react-virtualized-auto-sizer';
import {humanFriendlyPercentage} from '../util'

export function Sampler({ data }) {
    function* samplerWalker(refresh) {
        function getName(node) {
            if ('className' in node && 'methodName' in node) {
                return node['className'] + "." + node['methodName'] + '()'
            } else {
                return node.name
            }
        }

        // Push the initial data, specifically threads
        const stack = data.threads.map(thread => ({
            nestingLevel: 0,
            node: {
                ...thread,
                threadTime: thread.time
            }
        }))

        // Walk through the tree until we have no nodes available.
        while (stack.length !== 0) {
            const {
                node,
                nestingLevel,
            } = stack.pop();
            
            const id = nestingLevel + '-' + getName(node)
            const time = node.time
            const threadTime = nestingLevel === 0 ? time : node.threadTime

            const isOpened = yield refresh
            ? {
                id,
                isLeaf: node.children.length === 0,
                isOpenByDefault: nestingLevel > 0 && node.children.length === 1,
                name: getName(node),
                nestingLevel,
                time,
                threadTime,
                parentTime: node.parentTime
            }
            : id;
    
            if (node.children.length !== 0 && isOpened) {
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push({
                        nestingLevel: nestingLevel + 1,
                        node: {
                            ...node.children[i],
                            parentTime: time,
                            threadTime: threadTime
                        }
                    });
                }
            }
        }
    }

    return (
        <div id="sampler">
            <div id="stack">
                <AutoSizer>
                    {({height, width}) => {
                        width -= 30
                        return (
                            <Tree treeWalker={samplerWalker} itemSize={24} height={height} width={width}>
                                {Node}
                            </Tree>
                        )
                    }}
                </AutoSizer>
            </div>
        </div>
    );
}

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

const Node = ({data: {isLeaf, name, nestingLevel, time, threadTime, parentTimes}, isOpen, style, toggle}) => {
    let nodeClasses = "node hovered"
    if (!isOpen) {
        nodeClasses += " collapsed"
    }

    const adjustedStyle = {
        ...style
    }
    return (
        <div style={adjustedStyle}>
            <div className={nodeClasses} onClick={toggle}>
                <div className="name" style={{ marginLeft: (nestingLevel * 18) + 'px' }}>
                    <Name name={name} />
                    <span className="percent">
                        {humanFriendlyPercentage(time / threadTime)}
                    </span>
                </div>
                <span className="bar">
                    <span className="bar-inner" style={{ width: humanFriendlyPercentage(time / threadTime) }} />
                </span>
            </div>
        </div>
    )
};