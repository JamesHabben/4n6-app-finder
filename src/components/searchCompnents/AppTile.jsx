// AppTile.js
import React from 'react';
import { Card } from 'antd';

function AppTile({ app, tools, onClick }) {
  return (
    <Card bodyStyle={{ padding: '10px' }} onClick={() => onClick(app)}>
      <div style={{ textAlign: 'center' }}>
      <img 
        src={app.icon ? `/app-icons/${app.icon}` : "/images/logo192.png"} 
        alt={`${app.appName} App Logo`} 
        style={{ width: '75px', height: '75px', marginBottom: '1rem' }} 
      />
        <div className="app-name">{app.appName}</div>
        <div>
            {tools.map(tool =>
            tool.artifactList.some(toolApp => 
                toolApp[tool.appNameKey].toLowerCase() === app.appName.toLowerCase() || 
                (app.alternateNames && app.alternateNames.includes(toolApp[tool.appNameKey]))
            ) ? (
                <img src={`/images/${tool.icon}`} style={{ width: '30px', height: '30px', margin: '0 5px' }} 
                alt={`${tool.toolLongName} icon`} title={`${tool.toolLongName}`} key={tool.toolShortName} />
            ) : null
            )}
        </div>
      </div>
    </Card>
  );
}

export default AppTile;
