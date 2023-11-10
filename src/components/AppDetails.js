import React, { useEffect, useState, useContext, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink, Link, useParams } from 'react-router-dom';
//import { useDataFetching, fetchArtifacts } from '../services/useDataFetching';
import { DataContext } from 'services/DataContext';




//const toolRefs = {};

function AppDetails({ app, tools }) {
    const { apps, getMappedArtifacts, isLoadingTools  } = useContext(DataContext);
    const [toolArtifacts, setToolArtifacts] = useState(null);
    //const app = apps.find(app => app.appName === match.params.appName);
    //const { fetchArtifacts } = useDataFetching();
    const [artifacts, setArtifacts] = useState([]);
    const toolRefs = ({});

    

    useEffect(() => {
        //console.log("Tools in AppDetails:", tools);
        window.heap.track('App View', { appName: app.appName })

        if (tools && apps && tools.length > 0) {
            //console.log("Fetching artifacts for app:", app.appName, "with tools:", tools);

            const toolArtifacts = getMappedArtifacts(app.appName);
            setToolArtifacts(toolArtifacts);
        }
    }, [app.appName, tools, apps]);

    const setToolRef = (toolShortName) => {
        if (!toolRefs.current) {
            toolRefs.current = {};
        }
        if (!toolRefs.current[toolShortName]) {
            // Create a new ref for this tool if it doesn't already exist
            toolRefs.current[toolShortName] = React.createRef();
            //console.log(toolRefs.current[toolShortName])
            return toolRefs.current[toolShortName];
        }
        //console.log(toolRefs.current[toolShortName])
        return null; //toolRefs.current[toolShortName];
    };

    const handleIconClick = (toolShortName) => {
        //console.log(toolRefs)
        window.heap.track('App Tool Jump', { toolName: toolShortName })
        const ref = toolRefs.current[toolShortName];
        if (ref && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth' });
        } else {
            console.error('Ref for', toolShortName, 'not found');
        }
    };
    

    if (!app || !toolArtifacts) return null;

    function renderPropertyValue(key, value) {
        if (key === 'alternateNames' && Array.isArray(value) && value.length > 0) {
            return value.join(', ');
        }
        
        if (key === 'mappedTools' && Array.isArray(value)) {
            return value.map((tool, index) => (
                <img
                key={index}
                src={tool.icon}
                alt={`${tool.shortName} icon`}
                title={`${tool.longName} icon`}
                style={{ width: '50px', height: '50px', marginRight: '10px', cursor: 'pointer' }}
                onClick={() => handleIconClick(tool.shortName)}
                />
            ));
        }
      
        return value;
    }

    return (
        <div className='AppDetails'>
            {}
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
                ((app[key] && !Array.isArray(app[key])) || (Array.isArray(app[key]) && app[key].length > 0)) && (
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
            {toolArtifacts.map((toolApp, index) => (
                <div key={index} className="tool-card" ref={setToolRef(toolApp.toolShortName)} >
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start'  }}>
                        <img src={`/images/${toolApp.toolIcon}`} width={50} height={50}  style={{ marginRight: '10px' }} ></img>
                        <h3 style={{ marginRight: '10px' }}>{toolApp.toolLongName} </h3>
                        (<a href={toolApp.website}>{toolApp.toolWebsite}</a>)
                    </div>
                    <table className="property-table">
                        <tbody>
                            {Object.keys(toolApp).map((key, index) => (
                                (key !== 'toolLongName' && key !== 'toolIcon' && key !== 'toolWebsite') && (
                                    <tr key={index} className="property-row">
                                        <td className="property-name">
                                            <strong>{key}:</strong>
                                        </td>
                                        <td className="property-value">
                                            {toolApp[key]}
                                        </td>
                                    </tr>
                                )
                            ))}
                        </tbody>
                    </table>

                </div>
            ))}
        </div>
    );
}

export default AppDetails;
