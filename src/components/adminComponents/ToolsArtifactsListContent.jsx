import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';

import { DataContext, isMappedValue, mappedAppsFor, useToolArtifacts } from 'services/DataContext';

function ToolsArtifactsListContent() {
    const { tools } = useContext(DataContext);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
    const [displayedArtifactList, setDisplayedArtifactList] = useState([]);
    const [expandedArtifacts, setExpandedArtifacts] = useState(() => new Set());
    const navigate = useNavigate();
    const location = useLocation();
    const listRef = useRef(null);
    const cacheRef = useRef(
      new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: 56,
      })
    );
    const { data: artifactList = [], isPending: isLoadingArtifacts } = useToolArtifacts(selectedTool);

    const recomputeHeights = () => {
      cacheRef.current.clearAll();
      if (listRef.current) {
        listRef.current.recomputeRowHeights();
      }
    };

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const urlTool = decodeURIComponent(params.get('tool') || '');
      const urlUnmappedOnly = decodeURIComponent(params.get('unmappedOnly') || '');

      const toolFromUrl = tools.find(t => t.toolShortName === urlTool);

      if (selectedTool) {
        let newUrl = `?tool=${encodeURIComponent(selectedTool.toolShortName)}`;

        if (showOnlyHighlighted) {
          newUrl += '&unmappedOnly=1';
        }

        if (location.search !== newUrl) {
          navigate(newUrl);
        }
      } else if (toolFromUrl) {
        setSelectedTool(toolFromUrl);
        setShowOnlyHighlighted(urlUnmappedOnly === '1');
      }
    }, [showOnlyHighlighted, selectedTool, tools, location.search, navigate]);

    useEffect(() => {
      if (!selectedTool) {
        setDisplayedArtifactList([]);
        return;
      }

      const nextList = showOnlyHighlighted
        ? artifactList.filter(artifact => isUnmapped(artifact, selectedTool))
        : artifactList;
      setDisplayedArtifactList(nextList);
    }, [artifactList, selectedTool, showOnlyHighlighted]);

    useEffect(() => {
      recomputeHeights();
    }, [displayedArtifactList, expandedArtifacts]);

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
      return !isMappedValue(tool?.artifactMap?.[appName]);
    };

    const getMappedCount = (list, tool) => {
      if (!list || !tool) return 0;
      return list.filter(artifact => !isUnmapped(artifact, tool)).length;
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
      const mappedValue = selectedTool?.artifactMap?.[name];
      const mappedApp = mappedValue === false ? 'false' : mappedAppsFor(mappedValue).join(', ');

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
                  {unmapped ? (
                    <span className="artifact-tile-badge">unmapped</span>
                  ) : (
                    <span className="artifact-tile-badge">{mappedApp}</span>
                  )}
                </div>
                {expanded && (
                  <div
                    className="artifact-tile-body"
                    onClick={(e) => e.stopPropagation()}
                  >
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
            const isSelected = selectedTool?.toolShortName === tool.toolShortName;
            const total = isSelected ? artifactList.length : null;
            const mapped = isSelected ? getMappedCount(artifactList, tool) : tool.mappedNameCount;
            return (
              <Button
                key={tool.toolShortName}
                className={`${isSelected ? 'selected' : ''}`}
                onClick={() => handleToolClick(tool)}
              >
                {isSelected && !isLoadingArtifacts
                  ? `${tool.toolShortName} — ${total} total · ${mapped} mapped`
                  : `${tool.toolShortName} — ${tool.mappedNameCount} mapped`}
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
                {isLoadingArtifacts ? (
                  <p>Loading artifacts…</p>
                ) : (
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
                )}
                </div>
              </div>
              )}
      </div>
    );
  }

export default ToolsArtifactsListContent;
