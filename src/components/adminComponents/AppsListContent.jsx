import React, { useContext } from 'react';
import { DataContext, isDisplayableAppKey } from 'services/DataContext';

function AppsListContent() {
    const { apps } = useContext(DataContext);

    return (
      <div>
        {apps.map((app) => (
          <div key={app.appName} className="tool-card">
            <h2>
              <img
                src={app.icon ? `/app-icons/${app.icon}` : '/images/logo192.png'}
                alt={`${app.appName} Icon`}
                width="50"
                height="50"
                style={{ marginRight: '10px' }}
              />
              {app.appName}
            </h2>
            <table className="property-table">
                <tbody>
                    {Object.keys(app).map((key) => {
                        if (key === 'icon' || key === 'id' || !isDisplayableAppKey(key)) {
                            return null;
                        }
                        return (
                            <tr key={key} className="property-row">
                                <td className="property-name">
                                    <strong>{key}:</strong>
                                </td>
                                <td className="property-value">
                                    {key === 'mappedTools'
                                        ? (app[key] || []).map(tool => tool.shortName).join(', ')
                                        : Array.isArray(app[key])
                                            ? app[key].join(', ')
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
