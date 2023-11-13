// services/DataContext.js
import React, { createContext, useState, useEffect, useCallback } from 'react';

export const DataContext = createContext();



export function DataProvider({ children }) {
  const [apps, setApps] = useState([]);
  const [appTemplate, setAppTemplate] = useState(null);
  const [tools, setTools] = useState([]);
  const [isLoadingTools, setIsLoadingTools] = useState(true);

  
  useEffect(() => {
    // Fetch apps and tools data
    //console.log('use effect started')
    Promise.all([
      fetch('/apps-core.json').then(response => response.json()),
      fetch('/tools.json').then(response => response.json()),
      console.log('fetched files')
    ])
      .then(([appsData, toolsData]) => {
        const { template, appsList: appsList } = appsData;
        setAppTemplate(template);
        console.log(template)

        appsList.forEach(app => app.artifactCount = 0);
        
        // Fetch artifact data for each tool
        const artifactPromises = toolsData.map(tool =>
          fetch(`/${tool.artifactListFile}`)
            .then(response => response.json())
            .then(artifactList => {
              // Check if each artifact maps to an app
              artifactList.forEach(artifact => {
                const appName = artifact[tool.appNameKey];
                const app = appsList.find(
                  app => app.appName === appName ||
                    (app.alternateNames || []).includes(appName)
                );
                artifact.isMapped = app ? 'true' : 'false';
                if (app) {
                  app.artifactCount += 1;
                  // Update mappedTools for the app
                  app.mappedTools = app.mappedTools || [];
                  const toolData = {
                    shortName: tool.toolShortName,
                    longName: tool.toolLongName,
                    icon: tool.icon
                  };
                  if (!app.mappedTools.some(existingTool => existingTool.shortName === toolData.shortName)) {
                    app.mappedTools.push(toolData);
                  }
                  app.mappedTools.sort((a, b) => a.shortName.localeCompare(b.shortName));

                  // Update mappedApps for the tool
                  tool.mappedApps = tool.mappedApps || [];
                  if (!tool.mappedApps.some(existingApp => existingApp.appName === app.appName)) {
                    tool.mappedApps.push(app);
                  }
                }
              });
              return { ...tool, artifactList };
            })
        );
        console.log(appsData)

        // Set state once all data has been fetched and processed
        Promise.all(artifactPromises).then(artifactToolsData => {
          appsList.sort((a, b) => a.appName.localeCompare(b.appName))
          setApps(appsList);
          setTools(artifactToolsData.sort((a, b) => a.toolLongName.localeCompare(b.toolLongName)));
          setIsLoadingTools(false);
        });
      });
  }, [ ]);

  const getMappedArtifacts = useCallback((appName) => {
    if (!tools.length) {
      console.warn("Tools data is not yet loaded.");
      return [];
    }
    const toolArtifacts = tools.flatMap(tool =>
      tool.artifactList.filter(toolApp =>
        appName === toolApp[tool.appNameKey] ||
        (apps.find(app => app.appName === appName)?.alternateNames || []).includes(toolApp[tool.appNameKey])
      )
      .map(toolApp => ({ ...toolApp, 
            toolShortName: tool.toolShortName, 
            toolLongName: tool.toolLongName, 
            toolIcon: tool.icon, 
            toolWebsite: tool.website 
        }))
    );
    return toolArtifacts;
  }, [tools, apps]);

  return (
    <DataContext.Provider value={{ apps, tools, isLoadingTools, getMappedArtifacts, appTemplate }}>
      {children}
    </DataContext.Provider>
  );
}
