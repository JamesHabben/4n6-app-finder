import { useState, useContext, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';

import { DataContext, isMappedValue, mappedAppsFor, useToolArtifacts } from 'services/DataContext';

const EMPTY_LIST = [];

function getAppByNameKey(artifact, tool) {
    if (tool?.appNameKey) {
        return artifact[tool.appNameKey];
    }
    return null;
}

function isUnmapped(artifact, tool) {
    const appName = getAppByNameKey(artifact, tool);
    return !isMappedValue(tool?.artifactMap?.[appName]);
}

function ToolsArtifactsListContent() {
    const { tools } = useContext(DataContext);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
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
    const { data, isPending: isLoadingArtifacts } = useToolArtifacts(selectedTool);
    const artifactList = data ?? EMPTY_LIST;

    const displayedArtifactList = useMemo(() => {
      if (!selectedTool) {
        return EMPTY_LIST;
      }
      if (!showOnlyHighlighted) {
        return artifactList;
      }
      return artifactList.filter(artifact => isUnmapped(artifact, selectedTool));
    }, [artifactList, selectedTool, showOnlyHighlighted]);

    const recomputeHeights = () => {
      cacheRef.current.clearAll();
      if (listRef.current) {
        listRef.current.recomputeRowHeights();
      }
    };

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const urlTool = params.get('tool') || '';
      const urlUnmappedOnly = params.get('unmappedOnly') === '1';

      if (selectedTool) {
        if (urlTool !== selectedTool.toolShortName || urlUnmappedOnly !== showOnlyHighlighted) {
          const nextParams = new URLSearchParams();
          nextParams.set('tool', selectedTool.toolShortName);
          if (showOnlyHighlighted) {
            nextParams.set('unmappedOnly', '1');
          }
          navigate({ search: nextParams.toString() }, { replace: true });
        }
        return;
      }

      const toolFromUrl = tools.find(t => t.toolShortName === urlTool);
      if (toolFromUrl) {
        setSelectedTool(toolFromUrl);
        setShowOnlyHighlighted(urlUnmappedOnly);
      }
    }, [showOnlyHighlighted, selectedTool, tools, location.search, navigate]);

    useEffect(() => {
      recomputeHeights();
    }, [displayedArtifactList, expandedArtifacts]);

    const handleToolClick = (tool) => {
      setExpandedArtifacts(new Set());
      setSelectedTool(tool);
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
      const unmapped = isUnmapped(artifact, selectedTool);
      const expanded = isExpanded(artifact);
      const name = getAppByNameKey(artifact, selectedTool);
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
