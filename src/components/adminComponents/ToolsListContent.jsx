import React, { useContext } from 'react';
import { DataContext, isDisplayableToolKey } from 'services/DataContext';

function ToolsListContent() {
    const { tools } = useContext(DataContext);

    return (
      <div>
        {tools.map((tool) => (
          <div key={tool.toolShortName} className="tool-card">
            <h2>
              <img
                src={`/images/${tool.icon || 'logo192.png'}`}
                alt={`${tool.toolLongName} Icon`}
                width="100"
                height="100"
                style={{ marginRight: '10px' }}
              />
              {tool.toolLongName}
            </h2>
            <table className="property-table">
              <tbody>
                  {Object.keys(tool).map((key) => {
                      if (key === 'icon' || !isDisplayableToolKey(key)) {
                          return null;
                      }
                      return (
                          <tr key={key} className="property-row">
                              <td className="property-name">
                                  <strong>{key}:</strong>
                              </td>
                              <td className="property-value">
                                  {key === 'mappedApps'
                                      ? tool[key].length
                                      : /^https?:\/\//.test(tool[key])
                                          ? <a href={tool[key]} target="_blank" rel="noopener noreferrer">{tool[key]}</a>
                                          : String(tool[key] ?? '')
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

  export default ToolsListContent;
