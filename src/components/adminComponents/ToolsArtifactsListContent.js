import { useDataFetching } from "services/useDataFetching";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "AuthContext";
import { Button, Modal, Input } from 'antd';
import { appsService } from "services/appsService";

function ToolsArtifactsListContent() {
    const { apps, tools } = useDataFetching();
    const [selectedTool, setSelectedTool] = useState(null);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
    const { authState } = useContext(AuthContext);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedArtifact, setSelectedArtifact] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filteredApps, setFilteredApps] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [radioSelection, setRadioSelection] = useState('');
    const [newAppName, setNewAppName] = useState('');
    const [isDupe, setIsDupe] = useState(false);
    const [newRecord, setNewRecord] = useState(null);
    const [newAlternateName, setNewAlternateName] = useState('');
  
    useEffect(() => {
      // Reset the states when selectedArtifact changes
      setSearchInput('');
      setFilteredApps([]);
      setSelectedApp(null);
      setRadioSelection('');
      setNewAppName('');
      fetchNewRecord();
    }, [selectedArtifact]);
  
    useEffect(() => {
      if (apps) {
          //console.log("apps", apps)
          fetchNewRecord();
      }
    }, [apps])
  
    useEffect(() => {
      if (radioSelection === 'create') {
          setNewRecord(prevNewRecord => ({
              ...prevNewRecord,
              appName: newAppName
          }));
      }
    }, [newAppName, radioSelection]);
  
  
    const fetchNewRecord = async () => {
      console.log('Fetching new record...');
      const record = await appsService().getNewRecord(apps);
      console.log('Fetched record:', record);
      setNewRecord(record);
    };
    
  
    useEffect(() => {
      // Detect and alert if new app name is a dupe
      if (newAppName && radioSelection === 'create') {
        const dupeFound = appsService().isDupeName(apps, newAppName);
        setIsDupe(dupeFound);
      } else {
        setIsDupe(false); 
      }
    }, [newAppName, radioSelection, apps]);
  
    const addAlternateName = () => {
      if (newRecord.alternateNames.includes(newAlternateName)) {
        alert('This name already exists in the alternate names list');
        return;
      }
      setNewRecord(prevRecord => ({
          ...prevRecord,
          alternateNames: [...prevRecord.alternateNames, newAlternateName],
      }));
      setNewAlternateName('');  // Clear the input box
    };
  
  
    const handleArrayChange = (e, index) => {
      const newArray = [...newRecord.alternateNames];
      newArray[index] = e.target.value;
      setNewRecord({
        ...newRecord,
        alternateNames: newArray,
      });
    };
  
    const handleArrayRemove = (index) => {
      const updatedAlternateNames = newRecord.alternateNames.filter((_, idx) => idx !== index);
      setNewRecord(prevRecord => ({
        ...prevRecord,
        alternateNames: updatedAlternateNames,
      }));
    };
    
    
    const handlePropertyChange = (e, property) => {
      setNewRecord({
        ...newRecord,
        [property]: e.target.value,
      });
    };
     
    const handleSearchInputChange = (event) => {
      const searchValue = event.target.value.toLowerCase();
      setSearchInput(searchValue);
      const filtered = apps.filter(app =>
        app.appName.toLowerCase().includes(searchValue)
      );
      setFilteredApps(filtered.sort()); 
    };
  
    const showModal = (artifact) => {
      setSelectedArtifact(artifact)
      setIsModalVisible(true);
      //if (newAppName == '') setNewAppName(getAppByNameKey(selectedArtifact))
      //console.log(artifact)
      //console.log(selectedTool)
    };
  
    const handleOk = async () => {  // Make this method async
      try {
          if (radioSelection === 'add') {
              if (selectedApp && selectedApp.appName) {
                  const message = await appsService().handleAdd(apps, selectedApp.appName, getAppByNameKey(selectedArtifact), authState);
                  setIsModalVisible(false);
                  alert(message);
              } else {
                  alert('Please select an app to add this artifact to.');
              }
          } else if (radioSelection === 'create') {
              if (newAppName) {
                  if (appsService().isDupeName(apps, newAppName)) {
                      alert('The app name you entered already exists. Please use the "Add to Selected App" option or enter a different name.');
                  } else {
                      const message = await appsService().handleCreate(apps, newRecord, authState);
                      setIsModalVisible(false);
                      alert(message);
                  }
              } else {
                  alert('Please enter a name for the new app.');
              }
          } else {
              alert('Please select an action (add or create) and fill in the required fields.');
          }
      } catch (error) {
          // Catch any errors thrown by handleAdd or handleCreate
          alert(error.message);
      }
  };
        
  
    const handleCancel = () => {
      setIsModalVisible(false);
    };
  
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
              <button style={{ marginBottom: '10px' }} 
                onClick={() => setShowOnlyHighlighted(!showOnlyHighlighted)}>
                  {showOnlyHighlighted ? "Show All Artifacts" : "Show Unmapped Artifacts Only"}
              </button>
  
              {selectedTool.artifactList.map((app, index) => (
                (!showOnlyHighlighted || (showOnlyHighlighted && shouldHighlight(app))) && (
                  <div key={index} 
                          className={`app-info tool-card ${shouldHighlight(app) ? 'highlight' : ''}`}>
                      <h3>{getAppByNameKey(app)}</h3>
                      {shouldHighlight(app) && authState && (
                        <Button type="primary" style={{ marginBottom: '10px'  }} onClick={() => showModal(app)}>
                          Suggest an Edit
                        </Button>
                      )}
                      <table className="property-table">
                      <tbody>
                          {Object.keys(app).map((key) => (
                          <tr key={key} className="property-row">
                              <td className="property-name">
                              <strong>{key}:</strong>
                              </td>
                              <td className={`property-value ${shouldHighlight(getAppByNameKey(app)) ? '' : ''}`}>
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
        <Modal
            title="Suggest an Edit"
            open={isModalVisible}
            onOk={handleOk}
            onCancel={handleCancel}
            width={'80%'}
        >
          {selectedArtifact ? (
              <>
                  <h3>{getAppByNameKey(selectedArtifact)}</h3>
                  <table className="property-table" style={{ marginBottom: '10px'  }}>
                      <tbody>
                          {Object.keys(selectedArtifact).map((key) => (
                              <tr key={key} className="property-row">
                                  <td className="property-name">
                                      <strong>{key}:</strong>
                                  </td>
                                  <td className={`property-value `}>
                                      {selectedArtifact[key]}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '10px'  }}>
                      <h3>Existing App Search</h3>
                      <Input
                          type="text"
                          value={searchInput}
                          onChange={handleSearchInputChange}
                          placeholder="Search for an app"
                          style={{ marginBottom: '10px', width: '100%' }}
                      />
                      <div style={{ height: '150px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
                          {filteredApps.map((app, index) => (
                              <div
                                  key={index}
                                  style={{
                                      padding: '10px',
                                      borderBottom: '1px solid lightgrey',
                                      backgroundColor: selectedApp === app ? 'lightblue' : '',
                                      cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    console.log('search result item clicked with app:', app);
                                    setSelectedApp(app)}
                                  }
                              >
                                  {app.appName}
                              </div>
                          ))}
                      </div>
                  </div>
                  <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '10px' }}>
                      <div style={{ marginBottom: '10px' }}>
                          <label>
                              <input
                                  type="radio"
                                  value="add"
                                  checked={radioSelection === 'add'}
                                  onChange={(e) => setRadioSelection(e.target.value)}
                              />
                              Add to Selected App as alternateName
                          </label>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                          <label>
                              <input
                                  type="radio"
                                  value="create"
                                  checked={radioSelection === 'create'}
                                  onChange={(e) => {
                                    setRadioSelection(e.target.value)
                                    if (newAppName == '') setNewAppName(getAppByNameKey(selectedArtifact))
                                  }}
                              />
                              Create a new App
                          </label>
                      </div>
                      <Input
                        type="text"
                        value={
                            radioSelection === 'add' 
                                ? (selectedApp ? selectedApp.appName : '')
                                : (radioSelection === 'create' ? newAppName : '')
                        }
                        onChange={(e) => setNewAppName(e.target.value)}
                        readOnly={radioSelection === 'add'}
                      />
                      {isDupe && <span style={{ color: 'red', marginLeft: '10px' }}>App already exists</span>}
                  </div>
                  { radioSelection === 'create' && newRecord && (
                    <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '10px' }}>
                      <h3>New App Record Properties</h3>
                      {Object.keys(newRecord).map((key) => (
                        key !== 'appName' && key !== 'dateAdded' && key !== 'alternateNames' ? (
                          <div key={key}>
                            <label>{key}:</label>
                            <Input
                              value={newRecord[key]}
                              onChange={(e) => handlePropertyChange(e, key)}
                            />
                          </div>
                        ) : null
                      ))}
                      <div style={{ padding: '20px' }}>
                          <label>Alternate Names:</label>
                          { newRecord.alternateNames ? newRecord.alternateNames.map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                              <Input
                                value={item}
                                onChange={(e) => handleArrayChange(e, index)}
                              />
                              <button onClick={() => handleArrayRemove(index)}>X</button>
                            </div>
                            )) : ''}
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                              <Input
                                  type="text"
                                  value={newAlternateName}
                                  onChange={(e) => setNewAlternateName(e.target.value)}
                                  placeholder="Add alternate name"
                              />
                              <button onClick={addAlternateName}>
                                  Add
                              </button>
                          </div>
                      </div>
                    </div>
                  )}
              </>
          ) : null}
        </Modal>
      </div>
    );
  }

export default ToolsArtifactsListContent;