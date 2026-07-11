import React, { useContext, useMemo } from 'react';
import { DataContext } from 'services/DataContext';
import ListBarCard from 'components/dashboardComponents/ListBarCard';
import ProgressBarCard from 'components/dashboardComponents/ToolProgressCard';
import OneHitWondersCard from 'components/dashboardComponents/OneHitWondersCard';

function getTopAppsByMappedTools(apps) {
  const appsWithTools = apps.filter(app => app.mappedTools && app.mappedTools.length > 0);
  return [...appsWithTools].sort((a, b) => b.mappedTools.length - a.mappedTools.length).slice(0, 15);
}

function getTopAppsByArtifactCount(apps) {
  return [...apps].sort((a, b) => b.artifactCount - a.artifactCount).slice(0, 15);
}

function getToolsByAppCount(tools) {
  const toolsWithApps = tools.filter(tool => tool.mappedApps && tool.mappedApps.length > 0);
  return [...toolsWithApps].sort((a, b) => b.mappedApps.length - a.mappedApps.length).slice(0, 15);
}

function getOneHitWonderCounts(apps) {
  const counts = new Map();

  apps
    .filter(app => app.mappedTools?.length === 1)
    .forEach(app => {
      const tool = app.mappedTools[0];
      const existing = counts.get(tool.shortName) || {
        toolLongName: tool.longName,
        oneHitWonderCount: 0,
      };
      existing.oneHitWonderCount += 1;
      counts.set(tool.shortName, existing);
    });

  return [...counts.values()]
    .sort((a, b) => b.oneHitWonderCount - a.oneHitWonderCount)
    .slice(0, 15);
}

function PageDashboard() {
  const { apps, tools } = useContext(DataContext);
  const oneHitWonders = useMemo(
    () => apps.filter(app => app.mappedTools?.length === 1),
    [apps],
  );
  const oneHitWonderCounts = useMemo(() => getOneHitWonderCounts(apps), [apps]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '1rem', textAlign: 'left' }}>
      <h1>App Analysis</h1>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%', gap: '1rem' }}>
        <OneHitWondersCard oneHitCount={oneHitWonders.length} totalApps={apps.length} />
        <ListBarCard
          items={oneHitWonderCounts}
          nameKey='toolLongName'
          dataKey='oneHitWonderCount'
          title='One-Hit Wonders by Tool'
          displayFunction={(tool) => tool.oneHitWonderCount}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%', gap: '1rem' }}>
        <ListBarCard
          items={getTopAppsByMappedTools(apps)}
          nameKey='appName'
          dataKey='mappedTools'
          title='Top Apps by Mapped Tools'
          displayFunction={(app) => app.mappedTools ? app.mappedTools.length : 0}
        />
        <ListBarCard
          items={getTopAppsByArtifactCount(apps)}
          nameKey='appName'
          dataKey='artifactCount'
          title='Top Apps by Mapped Artifacts'
          displayFunction={(app) => app.artifactCount}
        />
      </div>
      <h1>Tool Analysis</h1>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%', gap: '1rem' }}>
        <ListBarCard
          items={getToolsByAppCount(tools)}
          nameKey='toolLongName'
          dataKey='mappedApps'
          title='Top Tools by Mapped Apps'
          displayFunction={(tool) => tool.mappedApps ? tool.mappedApps.length : 0}
        />
      </div>
      <h1>Tool & Artifact Mapping</h1>
      <ProgressBarCard tools={tools} />
    </div>
  );
}

export default PageDashboard;
