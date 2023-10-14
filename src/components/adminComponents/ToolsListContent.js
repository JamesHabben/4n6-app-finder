import { useDataFetching } from "services/useDataFetching";

function ToolsListContent() {
    const { tools } = useDataFetching();
  
    return (
      <div>
        {tools.map((tool) => (
          <div key={tool.toolShortName} className="tool-card">
            <h2>
              <img
                src={tool.icon || 'logo192.png'} 
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

  export default ToolsListContent;