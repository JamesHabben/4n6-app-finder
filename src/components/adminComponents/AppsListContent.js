import React, {  useContext  } from 'react';
import { DataContext } from 'services/DataContext';

function AppsListContent() {
    const { apps } = useContext(DataContext);
  
    return (
      <div>
        {apps.map((app) => (
          <div key={app.appName} className="tool-card">
            <h2>
              <img
                src={app.icon ? `app-icons/${app.icon}` : 'logo192.png'}
                alt={`${app.appName} Icon`}
                width="40"
                height="40"
                style={{ marginRight: '10px' }}
              />
              {app.appName}
            </h2>
            <table className="property-table">
                <tbody>
                    {Object.keys(app).map((key) => {
                        if (key === 'icon' || key === 'id') {
                            return null; // Skip rendering
                        }
                        return (
                            <tr key={key} className="property-row">
                                <td className="property-name">
                                    <strong>{key}:</strong>
                                </td>
                                <td className="property-value">
                                    {key === 'mappedTools' 
                                        ? app[key].map(tool => tool.shortName).join(', ')
                                        : app[key]
                                    }
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

          </div>
        ))}
      </div>
    );
  }
  
  export default AppsListContent;