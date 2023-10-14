//import React from "react";
import { useDataFetching } from "services/useDataFetching";

function AppsListContent() {
    const { apps } = useDataFetching();
  
    return (
      <div>
        {apps.map((app) => (
          <div key={app.appName} className="tool-card">
            <h2>
              <img
                src={app.icon || 'logo192.png'} // Use 'logo192.png' as the default if 'icon' is empty
                alt={`${app.appName} Icon`}
                width="30"
                height="30"
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
                        {app[key]}
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