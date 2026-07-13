import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Modal, Input, Typography } from 'antd';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';

import { DataContext } from 'services/DataContext';
import { AuthContext } from "AuthContext";
import { appsService } from "services/appsService";

function ToolsArtifactsListContent() {
    const { apps, tools, appTemplate } = useContext(DataContext);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
    const [displayedArtifactList, setDisplayedArtifactList] = useState([]);
    const [expandedArtifacts, setExpandedArtifacts] = useState(() => new Set());
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
    const [isTermModalVisible, setIsTermModalVisible] = useState(false);
    const [canCloseTermModal, SetCanCloseTermModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const listRef = useRef(null);
    const cacheRef = useRef(
      new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: 56,
      })
    );

    const recomputeHeights = () => {
      cacheRef.current.clearAll();
      if (listRef.current) {
        listRef.current.recomputeRowHeights();
      }
    };

    useEffect(() => {
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

      const toolFromUrl = tools.find(t => t.toolShortName === urlTool);

      if (selectedTool) {
        let newUrl = `?tool=${encodeURIComponent(selectedTool.toolShortName)}`;

        if (showOnlyHighlighted) {
          newUrl += '&unmappedOnly=1';
          const filteredList = selectedTool.artifactList.filter(artifact => isUnmapped(artifact, selectedTool));
          setDisplayedArtifactList(filteredList);
        } else {
          setDisplayedArtifactList(selectedTool.artifactList);
        }

        if (location.search !== newUrl) {
          navigate(newUrl);
        }
      } else if (toolFromUrl) {
        setSelectedTool(toolFromUrl);
        setShowOnlyHighlighted(urlUnmappedOnly === '1');
      }
    }, [showOnlyHighlighted, selectedTool, tools, location.search, navigate, apps]);

    useEffect(() => {
      recomputeHeights();
    }, [displayedArtifactList, expandedArtifacts]);

    useEffect(() => {
      if (apps) {
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
      setNewRecord(appTemplate);
    };


    useEffect(() => {
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
      setNewAlternateName('');
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
    };

    const handleOk = async () => {
      try {
          if (radioSelection === 'add') {
              if (selectedApp && selectedApp.appName) {
                setIsEditModalVisible(false);
                SetCanCloseTermModal(false);
                setIsTermModalVisible(true);
                await appsService().handleAdd(apps, selectedApp.appName, getAppByNameKey(selectedArtifact, selectedTool),
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
                    await appsService().handleCreate(apps, newRecord, getAppByNameKey(selectedArtifact, selectedTool),
                      authState, setTerminalOutput, appTemplate);
                    SetCanCloseTermModal(true);
                  }
              } else {
                  alert('Please enter a name for the new app.');
              }
          } else {
              alert('Please select an action (add or create) and fill in the required fields.');
          }
      } catch (error) {
          alert(error.message);
      }
    };


    const handleCancel = () => {
      setIsEditModalVisible(false);
    };

    const handleToolClick = (tool) => {
      setExpandedArtifacts(new Set());
      setSelectedTool(tool);
    };

    const getAppByNameKey = (artifact, tool = selectedTool) => {
      if (tool && tool.appNameKey) {
        return artifact[tool.appNameKey];
      }
      return null;
    };

    const formatArtifactValue = (value) => {
      if (value == null) return '';
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      if (typeof value === 'object') {
        return (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(value, null, 2)}
          </pre>
        );
      }
      return value;
    };

    const isUnmapped = (artifact, tool = selectedTool) => {
      const appName = getAppByNameKey(artifact, tool);
      return !apps.some((appInList) => {
        return appInList.appName === appName ||
          (appInList.alternateNames && appInList.alternateNames.includes(appName));
      });
    };

    const getMappedCount = (tool) => {
      if (!tool?.artifactList || !apps) return 0;
      return tool.artifactList.filter(artifact => !isUnmapped(artifact, tool)).length;
    };

    const isExpanded = (artifact) => expandedArtifacts.has(artifact);

    const toggleExpanded = (artifact) => {
      setExpandedArtifacts(prev => {
        const next = new Set(prev);
        if (next.has(artifact)) {
          next.delete(artifact);
        } else {
          next.add(artifact);
        }
        return next;
      });
    };

    const expandAll = () => {
      setExpandedArtifacts(new Set(displayedArtifactList));
    };

    const collapseAll = () => {
      setExpandedArtifacts(new Set());
    };

    function rowRenderer({ index, key, parent, style }) {
      const artifact = displayedArtifactList[index];
      const unmapped = isUnmapped(artifact);
      const expanded = isExpanded(artifact);
      const name = getAppByNameKey(artifact);

      return (
        <CellMeasurer
          cache={cacheRef.current}
          columnIndex={0}
          key={key}
          parent={parent}
          rowIndex={index}
        >
          {({ measure, registerChild }) => (
            <div
              ref={registerChild}
              style={style}
              onLoad={measure}
            >
              <div
                className={`artifact-tile ${unmapped ? 'highlight' : ''}`}
                onClick={() => toggleExpanded(artifact)}
              >
                <div className="artifact-tile-header">
                  <span className={`artifact-tile-chevron ${expanded ? 'expanded' : ''}`} aria-hidden>
                    ▸
                  </span>
                  <Typography.Title
                    level={5}
                    copyable={{ tooltips: false }}
                    style={{ margin: 0, flex: 1 }}
                  >
                    {name}
                  </Typography.Title>
                  {unmapped && (
                    <span className="artifact-tile-badge">unmapped</span>
                  )}
                </div>
                {expanded && (
                  <div
                    className="artifact-tile-body"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {unmapped && authState && (
                      <Button
                        type="primary"
                        style={{ marginBottom: '10px' }}
                        onClick={() => showModal(artifact)}
                      >
                        Suggest an Edit
                      </Button>
                    )}
                    <table className="property-table">
                      <tbody>
                        {Object.keys(artifact).map((propKey) => (
                          <tr key={propKey} className="property-row">
                            <td className="property-name">
                              <strong>{propKey}:</strong>
                            </td>
                            <td style={{ backgroundColor: 'white', paddingLeft: '.5rem' }}>
                              {formatArtifactValue(artifact[propKey])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </CellMeasurer>
      );
    }


    return (
      <div className="artifacts-page">
        <div className="tool-buttons">
          {tools.map((tool) => {
            const total = tool.artifactList?.length || 0;
            const mapped = getMappedCount(tool);
            return (
              <Button
                key={tool.toolShortName}
                className={`${selectedTool === tool ? 'selected' : ''}`}
                onClick={() => handleToolClick(tool)}
              >
                {tool.toolShortName} — {total} total · {mapped} mapped
              </Button>
            );
          })}
        </div>
          {selectedTool && (
              <div className="artifacts-page-body">
              <h2>{selectedTool.toolLongName} - Artifact List</h2>
              <div className="artifact-toolbar">
                <Button onClick={() => setShowOnlyHighlighted(!showOnlyHighlighted)}>
                  {showOnlyHighlighted ? "Show All Artifacts" : "Show Unmapped Artifacts Only"}
                </Button>
                <Button onClick={expandAll}>Expand All</Button>
                <Button onClick={collapseAll}>Collapse All</Button>
              </div>

                <div className="artifacts-list-viewport">
                <AutoSizer>
                  {({ height, width }) => (
                      <List
                        ref={listRef}
                        width={width}
                        height={height}
                        deferredMeasurementCache={cacheRef.current}
                        rowHeight={cacheRef.current.rowHeight}
                        rowRenderer={rowRenderer}
                        rowCount={displayedArtifactList.length}
                        overscanRowCount={8}
                      />
                  )}
                </AutoSizer>
                </div>
              </div>
              )}
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
                                      {formatArtifactValue(selectedArtifact[key])}
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
              onClick={() => {setTerminalOutput(''); setIsTermModalVisible(false)}}
              disabled={!canCloseTermModal}
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
