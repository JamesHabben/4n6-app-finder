import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink, Link, useParams } from 'react-router-dom';
import { useDataFetching, fetchArtifacts } from '../services/useDataFetching';

function AppDetails({ app, tools }) {
    const { apps, fetchArtifacts, isLoadingTools  } = useDataFetching();
    const [toolArtifacts, setToolArtifacts] = useState(null);
    //const app = apps.find(app => app.appName === match.params.appName);
    //const { fetchArtifacts } = useDataFetching();
    const [artifacts, setArtifacts] = useState([]);


    useEffect(() => {
        //console.log("Tools in AppDetails:", tools);

        if (tools && apps && tools.length > 0) {
            console.log("Fetching artifacts for app:", app.appName, "with tools:", tools);

            const toolArtifacts = fetchArtifacts(app.appName, tools, apps);
            setToolArtifacts(toolArtifacts);
        }
    }, [app.appName, tools, apps]);

     

      if (!app || !toolArtifacts) return null;


    return (
        <div className='AppDetails'>
            <div className='appIcon'>
                <img className='appIcon'
                    src={app.icon ? `/app-icons/${app.icon}` : '/logo192.png'}
                    alt={`${app.appName} App Icon`}
                />
            </div>
            <h1>{app.appName}</h1>
            {Object.keys(app).map(key => (
                app[key] && (
                    <div key={key}>
                        <strong>{key}:</strong> {app[key]}
                    </div>
                )
            ))}
            <h2>Tool Artifacts</h2>
            {toolArtifacts.map((toolApp, index) => (
                <div key={index} className="tool-card">
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start'  }}>
                        <img src={toolApp.toolIcon} width={50} height={50}  style={{ marginRight: '10px' }} ></img>
                        <h3 style={{ marginRight: '10px' }}>{toolApp.toolName} </h3>
                        (<a href={toolApp.website}>{toolApp.toolWebsite}</a>)
                    </div>
                    <table className="property-table">
                        <tbody>
                            {Object.keys(toolApp).map((key, index) => (
                                (key !== 'toolName' && key !== 'toolIcon' && key !== 'toolWebsite') && (
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
