import React, { useEffect, useState, useContext, useRef } from 'react';
import { DataContext, isDisplayableAppKey } from 'services/DataContext';
import { trackEvent } from 'services/analytics';

function AppDetails({ app, tools }) {
    const { getMappedArtifacts } = useContext(DataContext);
    const [toolArtifacts, setToolArtifacts] = useState(null);
    const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
    const toolRefs = useRef({});

    useEffect(() => {
        trackEvent('App View', { appName: app.appName });
        toolRefs.current = {};
        setToolArtifacts(null);

        if (!app?.appName || !tools?.length) {
            setToolArtifacts([]);
            return;
        }

        let cancelled = false;
        setIsLoadingArtifacts(true);

        getMappedArtifacts(app.appName)
            .then(mapped => {
                if (!cancelled) {
                    setToolArtifacts(mapped);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingArtifacts(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [app.appName, tools, getMappedArtifacts]);

    const setToolRef = (toolShortName) => (element) => {
        if (element) {
            toolRefs.current[toolShortName] = element;
        }
    };

    const handleIconClick = (toolShortName) => {
        trackEvent('App Tool Jump', { toolName: toolShortName });
        const node = toolRefs.current[toolShortName];
        if (node) {
            node.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!app) return null;

    function renderPropertyValue(key, value) {
        if (key === 'alternateNames' && Array.isArray(value) && value.length > 0) {
            return value.join(', ');
        }

        if (key === 'mappedTools' && Array.isArray(value)) {
            return value.map((tool) => (
                <img
                key={tool.shortName}
                src={`/images/${tool.icon}`}
                alt={`${tool.shortName} icon`}
                title={`${tool.longName} icon`}
                style={{ width: '50px', height: '50px', marginRight: '10px', cursor: 'pointer' }}
                onClick={() => handleIconClick(tool.shortName)}
                />
            ));
        }

        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }

        if (value != null && typeof value === 'object') {
            return (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        }

        return value;
    }

    return (
        <div className='AppDetails'>
            <div className='appIcon'>
                <img className='appIcon'
                    src={app.icon ? `/app-icons/${app.icon}` : '/images/logo192.png'}
                    alt={`${app.appName} App Icon`}
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
            </div>
            <h1>{app.appName}</h1>
            <table className="property-table">
            <tbody>
                {Object.keys(app).map(key => (
                isDisplayableAppKey(key) && ((app[key] && !Array.isArray(app[key])) || (Array.isArray(app[key]) && app[key].length > 0)) && (
                    <tr key={key} className="property-row">
                    <td className="property-name">
                        <strong>{key}:</strong>
                    </td>
                    <td className="property-value">
                        {renderPropertyValue(key, app[key])}
                    </td>
                    </tr>
                )
                ))}
            </tbody>
            </table>
            <h2>Tool Artifacts</h2>
            {isLoadingArtifacts && <p>Loading artifacts…</p>}
            {toolArtifacts && toolArtifacts.map((toolApp, index) => (
                <div key={index} className="tool-card" ref={setToolRef(toolApp.toolShortName)} >

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start'  }}>
                        <img src={`/images/${toolApp.toolIcon}`} width={50} height={50}  style={{ marginRight: '10px' }} alt="" />
                        <h3 style={{ marginRight: '10px' }}>{toolApp.toolLongName} </h3>
                        (<a href={toolApp.toolWebsite}>{toolApp.toolWebsite}</a>)
                    </div>
                    <table className="property-table">
                        <tbody>
                            {Object.keys(toolApp).map((key) => (
                                (key !== 'toolLongName' && key !== 'toolIcon' && key !== 'toolWebsite') && (
                                    <tr key={key} className="property-row">
                                        <td className="property-name">
                                            <strong>{key}:</strong>
                                        </td>
                                        <td className="property-value">
                                            {renderPropertyValue(key, toolApp[key])}
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>

                </div>
            ))}
            {!isLoadingArtifacts && toolArtifacts && toolArtifacts.length === 0 && (
                <p>No mapped tool artifacts.</p>
            )}
        </div>
    );
}

export default AppDetails;
