import React from 'react';
import { Card } from 'antd';

function AppTile({ app, onClick }) {
  return (
    <Card styles={{ body: { padding: '10px' } }} onClick={() => onClick(app)}>
      <div style={{ textAlign: 'center' }}>
      <img
        className="app-icon"
        src={app.icon ? `/app-icons/${app.icon}` : "/images/logo192.png"}
        alt={`${app.appName} App Logo`}
        style={{ width: '75px', height: '75px', marginBottom: '1rem' }}
      />
        <div className="app-name">{app.appName}</div>
        <div>
            {(app.mappedTools || []).map(tool => (
                <img src={`/images/${tool.icon}`} style={{ width: '30px', height: '30px', margin: '0 5px' }}
                alt={`${tool.longName} icon`} title={`${tool.longName}`} key={tool.shortName} />
            ))}
        </div>
      </div>
    </Card>
  );
}

export default AppTile;
