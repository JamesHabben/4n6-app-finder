import React, { createContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const DataContext = createContext();

const INTERNAL_APP_KEYS = new Set(['searchHaystack', 'mappedArtifactNames']);
const INTERNAL_TOOL_KEYS = new Set(['artifactMap']);

export function isDisplayableAppKey(key) {
  return !INTERNAL_APP_KEYS.has(key);
}

export function isDisplayableToolKey(key) {
  return !INTERNAL_TOOL_KEYS.has(key);
}

export function mappedAppsFor(mappedValue) {
  if (Array.isArray(mappedValue)) {
    return mappedValue.filter(Boolean);
  }
  if (typeof mappedValue === 'string' && mappedValue) {
    return [mappedValue];
  }
  return [];
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function buildSearchHaystack(app) {
  const parts = [app.appName, ...(app.alternateNames || []), ...(app.mappedArtifactNames || [])];
  return parts.join('\n').toLowerCase();
}

async function loadAppData() {
  const [appsData, toolsData] = await Promise.all([
    fetchJson('/apps-core.json'),
    fetchJson('/tools.json'),
  ]);

  const { template, appsList: rawAppsList } = appsData;

  const appsList = rawAppsList.map(app => ({
    ...app,
    alternateNames: [...(app.alternateNames || [])],
    mappedTools: [],
    mappedArtifactNames: [],
    artifactCount: 0,
  }));

  const appByName = new Map(appsList.map(app => [app.appName, app]));

  const toolsWithMaps = await Promise.all(
    toolsData.map(async (tool) => {
      const artifactMap = await fetchJson(`/${tool.mapFile}`);
      const toolMeta = {
        shortName: tool.toolShortName,
        longName: tool.toolLongName,
        icon: tool.icon,
      };

      Object.entries(artifactMap).forEach(([artifactName, mappedValue]) => {
        mappedAppsFor(mappedValue).forEach(mappedAppName => {
          const app = appByName.get(mappedAppName);
          if (!app) {
            return;
          }

          if (!app.mappedTools.some(existing => existing.shortName === toolMeta.shortName)) {
            app.mappedTools.push(toolMeta);
          }

          app.artifactCount += 1;

          if (
            artifactName !== app.appName &&
            !app.alternateNames.includes(artifactName) &&
            !app.mappedArtifactNames.includes(artifactName)
          ) {
            app.mappedArtifactNames.push(artifactName);
          }
        });
      });

      const mappedAppNames = [...new Set(
        Object.values(artifactMap).flatMap(mappedAppsFor)
      )]
        .filter(name => appByName.has(name))
        .sort((a, b) => a.localeCompare(b));

      return {
        ...tool,
        artifactMap,
        mappedApps: mappedAppNames,
        mappedNameCount: Object.keys(artifactMap).length,
      };
    })
  );

  appsList.forEach(app => {
    app.mappedTools.sort((a, b) => a.shortName.localeCompare(b.shortName));
    app.mappedArtifactNames.sort((a, b) => a.localeCompare(b));
    app.searchHaystack = buildSearchHaystack(app);
  });

  appsList.sort((a, b) => a.appName.localeCompare(b.appName));
  toolsWithMaps.sort((a, b) => a.toolLongName.localeCompare(b.toolLongName));

  return {
    apps: appsList,
    tools: toolsWithMaps,
    appTemplate: template,
    appByName,
  };
}

export function DataProvider({ children }) {
  const queryClient = useQueryClient();
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

  const loadToolArtifacts = useCallback(async (tool) => {
    if (!tool?.artifactListFile) {
      return [];
    }

    return queryClient.fetchQuery({
      queryKey: ['tool-artifacts', tool.toolShortName],
      queryFn: () => fetchJson(`/${tool.artifactListFile}`),
      staleTime: Infinity,
    });
  }, [queryClient]);

  const getMappedArtifacts = useCallback(async (appName) => {
    if (!tools.length) {
      return [];
    }

    const toolArtifacts = await Promise.all(
      tools.map(async (tool) => {
        const mappedNames = new Set(
          Object.entries(tool.artifactMap || {})
            .filter(([, mappedValue]) => mappedAppsFor(mappedValue).includes(appName))
            .map(([artifactName]) => artifactName)
        );

        if (mappedNames.size === 0) {
          return [];
        }

        const artifactList = await loadToolArtifacts(tool);
        return artifactList
          .filter(artifact => mappedNames.has(artifact[tool.appNameKey]))
          .map(artifact => ({
            ...artifact,
            toolShortName: tool.toolShortName,
            toolLongName: tool.toolLongName,
            toolIcon: tool.icon,
            toolWebsite: tool.website,
            isMapped: 'true',
          }));
      })
    );

    return toolArtifacts.flat();
  }, [tools, loadToolArtifacts]);

  const value = {
    apps,
    tools,
    isLoadingTools,
    getMappedArtifacts,
    loadToolArtifacts,
    appTemplate,
    appByName,
    isDataError: isError,
    dataError,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useToolArtifacts(tool) {
  return useQuery({
    queryKey: ['tool-artifacts', tool?.toolShortName],
    queryFn: () => fetchJson(`/${tool.artifactListFile}`),
    enabled: Boolean(tool?.artifactListFile),
    staleTime: Infinity,
  });
}
