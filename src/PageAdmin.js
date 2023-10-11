import React, { useState } from 'react';
import { useDataFetching } from './useDataFetching';

function ToolsListContent() {
    const { tools } = useDataFetching();
  
    return (
      <div>
        {tools.map((tool) => (
          <div key={tool.toolShortName} className="tool-card">
            <h2>
              <img
                src={tool.icon || 'logo192.png'} // Use 'logo192.png' as the default if 'icon' is empty
                alt={`${tool.toolLongName} Icon`}
                width="50"
                height="50"
                style={{ marginRight: '10px' }}
              />
              {tool.toolLongName}
            </h2>
            <table className="property-table">
              <tbody>
                {Object.keys(tool).map((key) => {
                  if (key === 'artifactList' || key === 'icon') {
                    return null; // Skip rendering
                  }
                  return (
                    <tr key={key} className="property-row">
                      <td className="property-name">
                        <strong>{key}:</strong>
                      </td>
                      <td className="property-value">
                        {/^https?:\/\//.test(tool[key]) ? <a href={tool[key]} target="_blank" rel="noopener noreferrer">{tool[key]}</a> : tool[key]}
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
        

function AppsListContent() {
    const { apps } = useDataFetching();

    return (
      <div>
        {apps.map((app) => (
          <div key={app.id} className="tool-card">
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

  function ToolsArtifactsListContent() {
    const { apps, tools } = useDataFetching();
    const [selectedTool, setSelectedTool] = useState(null);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);

  
    const handleToolClick = (tool) => {
      setSelectedTool(tool);
    };

      const getAppByNameKey = (app) => {
        if (selectedTool && selectedTool.appNameKey) {
          const propertyName = selectedTool.appNameKey;
          return app[propertyName];
        }
        return null;
      };
      
    
      const shouldHighlight = (app) => {
        const appName = getAppByNameKey(app);
        return !apps.some((appInList) => {
          // Check if the appName matches or if it's included in alternateNames
          return appInList.appName === appName || 
            (appInList.alternateNames && appInList.alternateNames.includes(appName));
        });
      };
      
      
    
      return (
        <div>
          <div className="tool-buttons">
            {tools.map((tool) => (
              <button
                key={tool.toolShortName}
                className={`tool-button ${selectedTool === tool ? 'selected' : ''}`}
                onClick={() => handleToolClick(tool)}
              >
                {tool.toolShortName} ({tool.artifactList.length})
              </button>
            ))}
          </div>
          <div className="tool-content">
            {selectedTool && (
              <div>
                <h2>{selectedTool.toolLongName} - Artifact List</h2>
                <button onClick={() => setShowOnlyHighlighted(!showOnlyHighlighted)}>
                    {showOnlyHighlighted ? "Show All" : "Show Missing Only"}
                </button>

                {selectedTool.artifactList.map((app, index) => (
                  (!showOnlyHighlighted || (showOnlyHighlighted && shouldHighlight(app))) && (
                    <div key={index} 
                            className={`app-info tool-card ${shouldHighlight(app) ? 'highlight' : ''}`}>
                        <h3>{getAppByNameKey(app)}</h3>
                        <table className="property-table">
                        <tbody>
                            {Object.keys(app).map((key) => (
                            <tr key={key} className="property-row">
                                <td className="property-name">
                                <strong>{key}:</strong>
                                </td>
                                <td className={`property-value ${shouldHighlight(app) ? '' : ''}`}>
                                {app[key]}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  

function PageAdmin() {
  const { apps, tools } = useDataFetching();
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [
    { id: 1, name: 'Tools List', contentComponent: ToolsListContent },
    { id: 2, name: 'Core Apps List', contentComponent: AppsListContent },
    { id: 3, name: 'Tools Artifacts List', contentComponent: ToolsArtifactsListContent },
  ];

  const onItemClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <div>
        <h1 className='pageTitle'>Admin Page</h1>
        <div style={{ display: 'flex', border: '1px solid #ccc', textAlign: 'left' }}>
        {/* Left column for items */}
        <div style={{ flex: '0 0 15%', padding: '1rem', borderRight: '1px solid #ccc' }}>
            <h2>Items</h2>
            <ul>
            {items.map((item) => (
                <li
                key={item.id}
                style={{
                    cursor: 'pointer',
                    textDecoration: selectedItem === item ? 'underline' : 'none',
                }}
                onClick={() => onItemClick(item)}
                >
                {item.name}
                </li>
            ))}
            </ul>
        </div>

        {/* Right column for content */}
        <div style={{ flex: '1', padding: '1rem' }}>
           
            {selectedItem ? (
            <div>
                <h2>{selectedItem.name}</h2>
                {selectedItem.contentComponent && (
                <selectedItem.contentComponent />
                )}
            </div>
            ) : (
            <p>Select an item to view its content.</p>
            )}
        </div>
        </div>
    </div>
  );
}

export default PageAdmin;
