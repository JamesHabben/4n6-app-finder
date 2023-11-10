import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Modal, Input, Typography } from 'antd';
//import { VariableSizeList as List } from 'react-window';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';


import { DataContext } from 'services/DataContext';
import { AuthContext } from "AuthContext";
import { appsService } from "services/appsService";

function ToolsArtifactsListContent() {
    const { apps, tools } = useContext(DataContext);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
    const [displayedArtifactList, setDisplayedArtifactList] = useState([]);
    const { authState } = useContext(AuthContext);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedArtifact, setSelectedArtifact] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filteredApps, setFilteredApps] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [radioSelection, setRadioSelection] = useState('');
    const [newAppName, setNewAppName] = useState('');
    const [isDupe, setIsDupe] = useState(false);
    const [newRecord, setNewRecord] = useState(null);
    const [newAlternateName, setNewAlternateName] = useState('');
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [isPerformingUpdate, setIsPerformingUpdate] = useState(false);
    const [isTermModalVisible, setIsTermModalVisible] = useState(false);
    const [canCloseTermModal, SetCanCloseTermModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    
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
      const params = new URLSearchParams(location.search);
      const urlTool = decodeURIComponent(params.get('tool'));
      const urlUnmappedOnly = decodeURIComponent(params.get('unmappedOnly'));
    
      // Validate the URL tool against the list of available tools
      const toolFromUrl = tools.find(t => t.toolShortName === urlTool);
    
      if (selectedTool) {
        // Construct the base URL
        let newUrl = `?tool=${encodeURIComponent(selectedTool.toolShortName)}`;
    
        if (showOnlyHighlighted) {
          newUrl += '&unmappedOnly=1';
          const filteredList = selectedTool.artifactList.filter(artifact => shouldHighlight(artifact));
          setDisplayedArtifactList(filteredList);
        } else {
          setDisplayedArtifactList(selectedTool.artifactList);
        }
    
        // Update the URL, if necessary
        if (location.search !== newUrl) {
          navigate(newUrl);
        }
      } else if (toolFromUrl) {
        // URL has a valid tool
        setSelectedTool(toolFromUrl);
        setShowOnlyHighlighted(urlUnmappedOnly === '1');
      } //else 
      // if (urlTool && !toolFromUrl) {
      //   navigate(navigate.path)
      // }
    }, [showOnlyHighlighted, selectedTool, tools, location.search, navigate]);

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
      //console.log('Fetching new record...');
      const record = await appsService().getNewRecord(apps);
      //console.log('Fetched record:', record);
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
      setIsEditModalVisible(true);
      //if (newAppName == '') setNewAppName(getAppByNameKey(selectedArtifact))
      //console.log(artifact)
      //console.log(selectedTool)
    };
  
    const handleOk = async () => {  // Make this method async
      try {
          if (radioSelection === 'add') {
              if (selectedApp && selectedApp.appName) {
                setIsEditModalVisible(false);  
                SetCanCloseTermModal(false);
                setIsTermModalVisible(true);
                const message = await appsService().handleAdd(apps, selectedApp.appName, getAppByNameKey(selectedArtifact), 
                  authState, setTerminalOutput);
                SetCanCloseTermModal(true);
              } else {
                  alert('Please select an app to add this artifact to.');
              }
          } else if (radioSelection === 'create') {
              if (newAppName) {
                  if (appsService().isDupeName(apps, newAppName)) {
                      alert('The app name you entered already exists. Please use the "Add to Selected App" option or enter a different name.');
                  } else {
                    setIsEditModalVisible(false);  
                    SetCanCloseTermModal(false);
                    setIsTermModalVisible(true);
                    const message = await appsService().handleCreate(apps, newRecord, getAppByNameKey(selectedArtifact), 
                      authState, setTerminalOutput);
                    SetCanCloseTermModal(true);
                    //alert(message);
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
      setIsEditModalVisible(false);
    };
  
    const handleToolClick = (tool) => {
      setSelectedTool(tool);
    };
  
    const getAppByNameKey = (app) => {
      //console.log("app value: ", app)
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

    const getItemSize = (index) => {
      // Assume each property takes up 30px of height for simplicity.
      // You might need a more accurate way to calculate the height.
      const numOfProperties = Object.keys(selectedTool.artifactList[index]).length;
      return 30 * numOfProperties + 100;
    };

    const cache = new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 100, 
    });

    const overlapAdjustment = 50;

    function rowRenderer({ index, key, parent, style }) {
      const app = displayedArtifactList[index];
      //console.log("in renderer artifacts: ", selectedTool.artifactList)
      return (
        <CellMeasurer
          cache={cache}
          columnIndex={0}
          key={key}
          parent={parent}
          rowIndex={index}
        >
          {({ measure }) => (
            <div onLoad={() => {
              measure();
              cache.set(index, 0, cache.getHeight(index, 0) + overlapAdjustment);
            }} 
            style={{...style, border: '1px solid #ccc',
                  borderRadius: '8px',
                  marginBottom: '5px',
                  padding: '15px',
                  maxWidth: '90%',
                  //overflowX: 'auto',
                  boxSizing: "border-box"
                  //height: (cache.getHeight(index, 0) || style.height) + overlapAdjustment,
            }} 
            className={` ${shouldHighlight(app) ? 'highlight' : ''}`}>
              <Typography.Title 
                level={3}
                copyable>
                {getAppByNameKey(app)}
              </Typography.Title>
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
                        <td style={{ backgroundColor:'white', paddingLeft:'.5rem' }}>
                        {app[key]}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          )}
        </CellMeasurer>
      );
    }
    
      
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh'}}>
        <div className="tool-buttons">
          {tools.map((tool) => (
            <Button
              key={tool.toolShortName}
              className={`${selectedTool === tool ? 'selected' : ''}`}
              onClick={() => handleToolClick(tool)}
            >
              {tool.toolShortName} ({tool.artifactList.length})
            </Button>
          ))}
        </div>
          {selectedTool && (<>
              <h2>{selectedTool.toolLongName} - Artifact List</h2>
              <Button style={{ marginBottom: '10px' }} 
                onClick={() => setShowOnlyHighlighted(!showOnlyHighlighted)}>
                  {showOnlyHighlighted ? "Show All Artifacts" : "Show Unmapped Artifacts Only"}
              </Button>
            
                <AutoSizer>
                  {({ height, width }) => {
                    //console.log("start list", selectedTool); 
                    //console.log("AutoSizer dimensions:", height, width);
                    return (
                      <List
                        width={width}
                        height={height}
                        deferredMeasurementCache={cache}
                        rowHeight={cache.rowHeight}//.bind(cache)}
                        rowRenderer={rowRenderer}
                        rowCount={displayedArtifactList.length}
                        overscanRowCount={5}
                        //onRowsRendered={() => console.log('Rows rendered')}
                      />
                    );
                  }}
                </AutoSizer>
              </>)}
        <Modal
            title="Suggest an Edit"
            open={isEditModalVisible}
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
                                    setSelectedApp(app);
                                    setRadioSelection('add');
                                  }}
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
        <Modal
          title="Sending Change..."
          open={isTermModalVisible}
          width='80%'
          onCancel={() => {
            if (canCloseTermModal) {
              setTerminalOutput(''); 
              setIsTermModalVisible(false)
            } else {
              return false
            }}}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={() => {setTerminalOutput(''); setIsTermModalVisible(false)}}  // This will close the modal when clicked
              disabled={!canCloseTermModal}  // Disable the button based on some condition
            >
              Close
            </Button>,
          ]}
          >
            <div style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
                {terminalOutput.length ? terminalOutput.map((line, index) => (
                <div key={index}>{line}</div>
                )) : ''}
            </div>
        </Modal>
      </div>
    );
  }

export default ToolsArtifactsListContent;