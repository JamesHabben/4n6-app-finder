import { useState, useContext, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { useVirtualizer } from '@tanstack/react-virtual';

import { DataContext, isMappedValue, mappedAppsFor, useToolArtifacts } from 'services/DataContext';
import AppDetailsModal from 'components/AppDetailsModal';

const EMPTY_LIST = [];
const COLLAPSED_ROW_HEIGHT = 52;
const ROW_GAP = 6;

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

function artifactPlatform(artifact, tool) {
    const key = tool?.platformKey || 'Platform';
    const value = artifact?.[key];
    if (value == null || value === '') {
        return null;
    }
    if (Array.isArray(value)) {
        const label = value.filter(Boolean).join(', ');
        return label || null;
    }
    return String(value);
}

function MappedAppLabel({ mappedValue, appByName, onOpenApp }) {
    if (mappedValue === false) {
        return <span className="artifact-tile-badge">false</span>;
    }

    const names = mappedAppsFor(mappedValue);
    if (names.length === 0) {
        return <span className="artifact-tile-badge">unmapped</span>;
    }

    return (
        <span className="artifact-tile-mapped">
            {names.map((appName, index) => {
                const app = appByName?.get(appName);
                return (
                    <span key={appName}>
                        {index > 0 ? ', ' : null}
                        {app ? (
                            <Button
                                type="link"
                                className="artifact-tile-app-link"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenApp(app);
                                }}
                            >
                                {appName}
                            </Button>
                        ) : (
                            appName
                        )}
                    </span>
                );
            })}
        </span>
    );
}

function ToolsArtifactsListContent() {
    const { tools, appByName } = useContext(DataContext);
    const [selectedTool, setSelectedTool] = useState(null);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);
    const [expandedArtifacts, setExpandedArtifacts] = useState(() => new Set());
    const [selectedApp, setSelectedApp] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const listParentRef = useRef(null);
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

    const rowVirtualizer = useVirtualizer({
      count: displayedArtifactList.length,
      getScrollElement: () => listParentRef.current,
      estimateSize: (index) => (
        expandedArtifacts.has(displayedArtifactList[index])
          ? 240
          : COLLAPSED_ROW_HEIGHT
      ),
      gap: ROW_GAP,
      overscan: 8,
      getItemKey: (index) => {
        const artifact = displayedArtifactList[index];
        return expandedArtifacts.has(artifact) ? `${index}:open` : `${index}:closed`;
      },
      shouldAdjustScrollPositionOnItemSizeChange: () => false,
      useFlushSync: false,
    });

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

    const openMappedApp = useCallback((app) => {
      setSelectedApp(app);
    }, []);

    const closeAppModal = useCallback(() => {
      setSelectedApp(null);
    }, []);

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

                <div className="artifacts-list-viewport" ref={listParentRef}>
                {isLoadingArtifacts ? (
                  <p>Loading artifacts…</p>
                ) : (
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const artifact = displayedArtifactList[virtualRow.index];
                      const unmapped = isUnmapped(artifact, selectedTool);
                      const expanded = isExpanded(artifact);
                      const name = getAppByNameKey(artifact, selectedTool);
                      const mappedValue = selectedTool?.artifactMap?.[name];
                      const platform = artifactPlatform(artifact, selectedTool);

                      return (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={expanded ? rowVirtualizer.measureElement : undefined}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start}px)`,
                            height: expanded ? undefined : COLLAPSED_ROW_HEIGHT,
                          }}
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
                              <span className="artifact-tile-meta">
                                {unmapped ? (
                                  <span className="artifact-tile-badge">unmapped</span>
                                ) : (
                                  <MappedAppLabel
                                    mappedValue={mappedValue}
                                    appByName={appByName}
                                    onOpenApp={openMappedApp}
                                  />
                                )}
                                {platform ? (
                                  <span className="platform-badge">{platform}</span>
                                ) : null}
                              </span>
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
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
              )}
        <AppDetailsModal
          app={selectedApp}
          open={Boolean(selectedApp)}
          onCancel={closeAppModal}
        />
      </div>
    );
  }

export default ToolsArtifactsListContent;
