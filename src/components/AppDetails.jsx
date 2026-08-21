import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Button, Collapse } from 'antd';
import { DataContext } from 'services/DataContext';
import { trackEvent } from 'services/analytics';

const APP_HEADER_KEYS = new Set([
  'appName',
  'icon',
  'category',
  'websiteUrl',
  'appleStoreUrl',
  'googlePlayUrl',
  'mappedTools',
]);

const ARTIFACT_HIDDEN_KEYS = new Set([
  'toolShortName',
  'toolLongName',
  'toolIcon',
  'toolWebsite',
  'isMapped',
]);

function hasValue(value) {
  if (value == null || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

function formatValue(value) {
  if (Array.isArray(value)) {
    if (value.every(item => typeof item !== 'object')) {
      return value.join(', ');
    }
    return (
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value != null && typeof value === 'object') {
    return (
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return value;
}

function ExternalLink({ href, children }) {
  if (!href) {
    return null;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function PropertyTable({ record, hideKeys = [] }) {
  const hidden = new Set(hideKeys);
  const keys = Object.keys(record).filter(key => !hidden.has(key) && hasValue(record[key]));

  if (keys.length === 0) {
    return null;
  }

  return (
    <table className="property-table">
      <tbody>
        {keys.map(key => (
          <tr key={key} className="property-row">
            <td className="property-name">
              <strong>{key}:</strong>
            </td>
            <td className="property-value">{formatValue(record[key])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArtifactRow({ artifact, appNameKey, platformKey, open, onToggle }) {
  const nameKey = appNameKey || 'name';
  const platKey = platformKey || 'Platform';
  const name = artifact[nameKey];
  const platform = artifact[platKey];
  const hideKeys = [...ARTIFACT_HIDDEN_KEYS, nameKey, platKey];

  return (
    <Collapse
      className="artifact-collapse"
      ghost
      activeKey={open ? ['details'] : []}
      onChange={keys => onToggle(Array.isArray(keys) && keys.includes('details'))}
      items={[{
        key: 'details',
        label: (
          <span className="artifact-expander-label">
            <span className="artifact-row-name">{name}</span>
            {hasValue(platform) ? <span className="platform-badge">{String(platform)}</span> : null}
          </span>
        ),
        children: <PropertyTable record={artifact} hideKeys={hideKeys} />,
      }]}
    />
  );
}

function groupArtifacts(artifacts, tools, mappedTools) {
  const groups = new Map();

  (artifacts || []).forEach(artifact => {
    const key = artifact.toolShortName;
    if (!groups.has(key)) {
      const tool = tools.find(item => item.toolShortName === key);
      groups.set(key, {
        toolShortName: key,
        toolLongName: artifact.toolLongName,
        toolIcon: artifact.toolIcon,
        toolWebsite: artifact.toolWebsite,
        appNameKey: tool?.appNameKey,
        platformKey: tool?.platformKey || 'Platform',
        artifacts: [],
      });
    }
    groups.get(key).artifacts.push(artifact);
  });

  const ordered = [];
  const seen = new Set();

  (mappedTools || []).forEach(tool => {
    if (groups.has(tool.shortName)) {
      ordered.push(groups.get(tool.shortName));
      seen.add(tool.shortName);
    }
  });

  groups.forEach((group, key) => {
    if (!seen.has(key)) {
      ordered.push(group);
    }
  });

  return ordered;
}

function AppDetails({ app, tools }) {
  const { getMappedArtifacts } = useContext(DataContext);
  const [toolArtifacts, setToolArtifacts] = useState(null);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [openTools, setOpenTools] = useState([]);
  const [openArtifacts, setOpenArtifacts] = useState({});

  useEffect(() => {
    trackEvent('App View', { appName: app.appName });
    setToolArtifacts(null);
    setOpenTools([]);
    setOpenArtifacts({});

    if (!app?.appName || !tools?.length) {
      setToolArtifacts([]);
      return;
    }

    let cancelled = false;
    setIsLoadingArtifacts(true);

    getMappedArtifacts(app.appName)
      .then(mapped => {
        if (!cancelled) {
          setToolArtifacts(mapped);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingArtifacts(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [app.appName, tools, getMappedArtifacts]);

  const groups = useMemo(
    () => groupArtifacts(toolArtifacts, tools, app.mappedTools),
    [toolArtifacts, tools, app.mappedTools],
  );

  const expandAllTools = () => {
    setOpenTools(groups.map(group => group.toolShortName));
  };

  const collapseAllTools = () => {
    setOpenTools([]);
  };

  const expandAllArtifacts = (toolShortName, count) => {
    setOpenArtifacts(prev => ({
      ...prev,
      [toolShortName]: Array.from({ length: count }, (_, index) => String(index)),
    }));
  };

  const collapseAllArtifacts = (toolShortName) => {
    setOpenArtifacts(prev => ({
      ...prev,
      [toolShortName]: [],
    }));
  };

  const toggleArtifact = (toolShortName, index, isOpen) => {
    const key = String(index);
    setOpenArtifacts(prev => {
      const current = prev[toolShortName] || [];
      const next = isOpen
        ? (current.includes(key) ? current : [...current, key])
        : current.filter(item => item !== key);
      return { ...prev, [toolShortName]: next };
    });
  };

  const handleIconClick = (toolShortName) => {
    trackEvent('App Tool Jump', { toolName: toolShortName });
    setOpenTools(prev => (prev.includes(toolShortName) ? prev : [...prev, toolShortName]));
    window.setTimeout(() => {
      document.getElementById(`app-tool-${toolShortName}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  };

  const extraFields = Object.keys(app).filter(key => (
    !APP_HEADER_KEYS.has(key)
    && key !== 'searchHaystack'
    && key !== 'mappedArtifactNames'
    && hasValue(app[key])
  ));

  if (!app) return null;

  const collapseItems = groups.map(group => {
    const artifactKeys = openArtifacts[group.toolShortName] || [];
    const toolIsOpen = openTools.includes(group.toolShortName);

    return {
      key: group.toolShortName,
      label: (
        <span id={`app-tool-${group.toolShortName}`} className="app-tool-label">
          <img src={`/images/${group.toolIcon}`} width={28} height={28} alt="" />
          <span>{group.toolLongName}</span>
          <span className="app-tool-count">{group.artifacts.length}</span>
          {group.toolWebsite && (
            <a
              href={group.toolWebsite}
              target="_blank"
              rel="noopener noreferrer"
              onClick={event => event.stopPropagation()}
            >
              website
            </a>
          )}
        </span>
      ),
      extra: toolIsOpen ? (
        <span
          className="app-tool-artifact-actions"
          onClick={event => event.stopPropagation()}
        >
          <Button
            size="small"
            onClick={() => expandAllArtifacts(group.toolShortName, group.artifacts.length)}
          >
            Expand Artifacts
          </Button>
          <Button
            size="small"
            onClick={() => collapseAllArtifacts(group.toolShortName)}
          >
            Collapse Artifacts
          </Button>
        </span>
      ) : null,
      children: group.artifacts.map((artifact, index) => (
        <ArtifactRow
          key={`${group.toolShortName}-${index}`}
          artifact={artifact}
          appNameKey={group.appNameKey}
          platformKey={group.platformKey}
          open={artifactKeys.includes(String(index))}
          onToggle={isOpen => toggleArtifact(group.toolShortName, index, isOpen)}
        />
      )),
    };
  });

  return (
    <div className="app-details">
      <div className="app-details-header">
        <img
          src={app.icon ? `/app-icons/${app.icon}` : '/images/logo192.png'}
          alt={`${app.appName} App Icon`}
        />
        <div className="app-details-summary">
          <h1>{app.appName}</h1>
          {app.category && <div className="app-details-category">{app.category}</div>}
          <div className="app-details-links">
            <ExternalLink href={app.websiteUrl}>Website</ExternalLink>
            <ExternalLink href={app.appleStoreUrl}>App Store</ExternalLink>
            <ExternalLink href={app.googlePlayUrl}>Play Store</ExternalLink>
          </div>
          <div className="app-details-tools">
            {(app.mappedTools || []).map(tool => (
              <img
                key={tool.shortName}
                src={`/images/${tool.icon}`}
                alt={`${tool.shortName} icon`}
                title={tool.longName}
                onClick={() => handleIconClick(tool.shortName)}
              />
            ))}
          </div>
        </div>
      </div>

      {extraFields.length > 0 && (
        <details className="app-details-meta">
          <summary>More app details</summary>
          <PropertyTable record={app} hideKeys={[...APP_HEADER_KEYS, 'searchHaystack', 'mappedArtifactNames']} />
        </details>
      )}

      <div className="app-details-artifacts-header">
        <h2>Tool Artifacts</h2>
        {groups.length > 0 && (
          <div className="app-details-artifacts-actions">
            <Button size="small" onClick={expandAllTools}>Expand Tools</Button>
            <Button size="small" onClick={collapseAllTools}>Collapse Tools</Button>
          </div>
        )}
      </div>
      {isLoadingArtifacts && <p>Loading artifacts…</p>}
      {!isLoadingArtifacts && groups.length === 0 && (
        <p>No mapped tool artifacts.</p>
      )}
      {groups.length > 0 && (
        <Collapse
          activeKey={openTools}
          onChange={keys => setOpenTools(Array.isArray(keys) ? keys : [keys])}
          items={collapseItems}
        />
      )}
    </div>
  );
}

export default AppDetails;
