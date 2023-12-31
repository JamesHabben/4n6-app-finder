import { useEffect, useState } from 'react';

export function useDataFetchingzz() { 
  const [apps, setApps] = useState([]);
  const [tools, setTools] = useState([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);

  useEffect(() => {
    // Fetch apps and tools data
    Promise.all([
      fetch('/apps-core.json').then(response => response.json()),
      fetch('/tools.json').then(response => response.json()),
      console.log('fetched files')
    ])
      .then(([appsData, toolsData]) => {
        // Fetch artifact data for each tool
        const artifactPromises = toolsData.map(tool =>
          fetch(`/${tool.artifactListFile}`)
            .then(response => response.json())
            .then(artifactList => {
              // Check if each artifact maps to an app
              artifactList.forEach(artifact => {
                const appName = artifact[tool.appNameKey];
                const app = appsData.find(
                  app => app.appName === appName ||
                    (app.alternateNames || []).includes(appName)
                );
                artifact.isMapped = !!app;
                if (app) {
                  // Update mappedTools for the app
                  app.mappedTools = app.mappedTools || [];
                  app.mappedTools.push({
                    shortName: tool.toolShortName,
                    longName: tool.toolLongName,
                    icon: tool.icon
                  });

                  // Update mappedApps for the tool
                  tool.mappedApps = tool.mappedApps || [];
                  tool.mappedApps.push(app);
                }
              });
              return { ...tool, artifactList };
            })
        );

        // Set state once all data has been fetched and processed
        Promise.all(artifactPromises).then(artifactToolsData => {
          setApps(appsData.sort((a, b) => a.appName.localeCompare(b.appName)));
          setTools(artifactToolsData.sort((a, b) => a.toolLongName.localeCompare(b.toolLongName)));
          setIsLoadingTools(false);
        });
      });
  }, []);

  return { apps, tools, isLoadingTools };
}
