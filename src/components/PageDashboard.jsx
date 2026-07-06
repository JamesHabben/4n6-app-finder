import React, { useContext } from 'react';
import { DataContext } from 'services/DataContext';
import ListCard from 'components/dashboardComponents/ListCard';
import ListBarCard from 'components/dashboardComponents/ListBarCard';
import ToolProgressCard from 'components/dashboardComponents/ToolProgressCard'
import ProgressBarCard from 'components/dashboardComponents/ToolProgressCard';


function getTopAppsByMappedTools(apps) {
  //console.log(apps)  
  const appsWithTools = apps.filter(app => app.mappedTools && app.mappedTools.length > 0);
    const sortedApps = appsWithTools.sort((a, b) => b.mappedTools.length - a.mappedTools.length);
    return sortedApps.slice(0, 15);
};

function getTopAppsByArtifactCount(apps) {
    return [...apps].sort((a, b) => b.artifactCount - a.artifactCount).slice(0, 15);
}

function getLatestAppsByDateAdded(apps) {
    return [...apps].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 15);
}

function getLatestAppsByDateUpdated(apps) {
    return [...apps].sort((a, b) => new Date(b.dateUpdated) - new Date(a.dateUpdated)).slice(0, 15);
}

function getToolsByAppCount(tools) {
    const toolsWithApps = tools.filter(tool => tool.mappedApps && tool.mappedApps.length > 0);
    const sortedTools = toolsWithApps.sort((a, b) => b.mappedApps.length - a.mappedApps.length);
    return sortedTools.slice(0, 15);
}


function PageDashboard() {
  const { apps, tools } = useContext(DataContext);

  //console.log('dashboard apps ', apps)
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '1rem', textAlign: 'left' }}>
      <h1>App Analysis</h1>
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
          title='Top Apps by Mapped Tools'
          displayFunction={(tool) => tool.mappedApps ? tool.mappedApps.length : 0}
        />

      </div>
      <h1>Tool & Artifact Mapping</h1>
      <ProgressBarCard 
        tools={tools}
      />
    </div>
  );
}

export default PageDashboard;
