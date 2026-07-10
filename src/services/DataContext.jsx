// services/DataContext.jsx
import React, { createContext, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export const DataContext = createContext();

function createAppLookup(appsList) {
  const appLookup = new Map();
  const appByName = new Map();

  appsList.forEach(app => {
    appByName.set(app.appName, app);

    if (!appLookup.has(app.appName)) {
      appLookup.set(app.appName, app);
    }

    (app.alternateNames || []).forEach(alternateName => {
      if (!appLookup.has(alternateName)) {
        appLookup.set(alternateName, app);
      }
    });
  });

  return { appLookup, appByName };
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function loadAppData() {
  const [appsData, toolsData] = await Promise.all([
    fetchJson('/apps-core.json'),
    fetchJson('/tools.json'),
  ]);

  const { template, appsList } = appsData;
  const { appLookup, appByName } = createAppLookup(appsList);

  appsList.forEach(app => {
    app.artifactCount = 0;
    app.mappedCategories = [];
  });

  const artifactToolsData = await Promise.all(
    toolsData.map(tool =>
      fetchJson(`/${tool.artifactListFile}`).then(artifactList => {
        artifactList.forEach(artifact => {
          const appName = artifact[tool.appNameKey];
          const app = appLookup.get(appName);

          artifact.isMapped = app ? 'true' : 'false';

          if (app) {
            app.artifactCount += 1;
            app.mappedTools = app.mappedTools || [];

            const category = artifact.category || artifact.Category;
            if (category && !app.mappedCategories.includes(category)) {
              app.mappedCategories.push(category);
              app.mappedCategories.sort((a, b) => a.localeCompare(b));
            }

            const toolData = {
              shortName: tool.toolShortName,
              longName: tool.toolLongName,
              icon: tool.icon
            };

            if (!app.mappedTools.some(existingTool => existingTool.shortName === toolData.shortName)) {
              app.mappedTools.push(toolData);
            }

            app.mappedTools.sort((a, b) => a.shortName.localeCompare(b.shortName));
            tool.mappedApps = tool.mappedApps || [];

            if (!tool.mappedApps.some(existingApp => existingApp.appName === app.appName)) {
              tool.mappedApps.push(app);
            }
          }
        });

        return { ...tool, artifactList };
      })
    )
  );

  appsList.sort((a, b) => a.appName.localeCompare(b.appName));
  artifactToolsData.sort((a, b) => a.toolLongName.localeCompare(b.toolLongName));

  return {
    apps: appsList,
    tools: artifactToolsData,
    appTemplate: template,
    appLookup,
    appByName,
  };
}

export function DataProvider({ children }) {
  const {
    data,
    error: dataError,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['app-data'],
    queryFn: loadAppData,
  });

  const apps = data?.apps ?? [];
  const tools = data?.tools ?? [];
  const appByName = data?.appByName;
  const appTemplate = data?.appTemplate ?? null;
  const isLoadingTools = isPending;

  const getMappedArtifacts = useCallback((appName) => {
    if (!tools.length) {
      console.warn("Tools data is not yet loaded.");
      return [];
    }
    const app = appByName?.get(appName);
    const matchingNames = new Set([
      appName,
      ...(app?.alternateNames || []),
    ]);

    const toolArtifacts = tools.flatMap(tool =>
      tool.artifactList.filter(toolApp =>
        matchingNames.has(toolApp[tool.appNameKey])
      )
      .map(toolApp => ({ ...toolApp,
            toolShortName: tool.toolShortName,
            toolLongName: tool.toolLongName,
            toolIcon: tool.icon,
            toolWebsite: tool.website
        }))
    );
    return toolArtifacts;
  }, [tools, appByName]);

  const value = {
    apps,
    tools,
    isLoadingTools,
    getMappedArtifacts,
    appTemplate,
    isDataError: isError,
    dataError,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
