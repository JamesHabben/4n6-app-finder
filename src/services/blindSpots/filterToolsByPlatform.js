import { mappedAppsFor } from 'services/DataContext';

const ANALYSIS_PLATFORM_TOKENS = {
  apple: new Set(['ios', 'apple', 'iphone', 'ipados']),
  android: new Set(['android']),
};

export function analysisPlatformLabel(platform) {
  if (platform === 'apple') {
    return 'iOS';
  }
  if (platform === 'android') {
    return 'Android';
  }
  return '';
}

export function artifactMatchesAnalysisPlatform(platformField, analysisPlatform) {
  const wanted = ANALYSIS_PLATFORM_TOKENS[analysisPlatform];
  if (!wanted) {
    return true;
  }

  const tokens = String(platformField || '')
    .split(/[,/]/)
    .map(part => part.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) {
    return false;
  }

  return tokens.some(token => wanted.has(token));
}

function supportedToolsByCatalogApp(tools, artifactLists, analysisPlatform) {
  const byApp = new Map();

  tools.forEach(tool => {
    const artifacts = artifactLists?.[tool.toolShortName];
    if (!artifacts?.length) {
      return;
    }

    const appNameKey = tool.appNameKey;
    const platformKey = tool.platformKey || 'Platform';
    const matchingArtifactNames = new Set();

    artifacts.forEach(artifact => {
      if (artifactMatchesAnalysisPlatform(artifact[platformKey], analysisPlatform)) {
        matchingArtifactNames.add(artifact[appNameKey]);
      }
    });

    Object.entries(tool.artifactMap || {}).forEach(([artifactName, mappedValue]) => {
      if (!matchingArtifactNames.has(artifactName)) {
        return;
      }
      mappedAppsFor(mappedValue).forEach(appName => {
        if (!byApp.has(appName)) {
          byApp.set(appName, new Set());
        }
        byApp.get(appName).add(tool.toolShortName);
      });
    });
  });

  return byApp;
}

export function applyPlatformToolFilter(matchedApps, tools, artifactLists, analysisPlatform) {
  if (!analysisPlatform || !ANALYSIS_PLATFORM_TOKENS[analysisPlatform]) {
    return matchedApps;
  }

  const supported = supportedToolsByCatalogApp(tools, artifactLists, analysisPlatform);

  return matchedApps.map(app => {
    if (!app.catalogApp) {
      return app;
    }

    const allowed = supported.get(app.catalogApp.appName);
    return {
      ...app,
      catalogApp: {
        ...app.catalogApp,
        mappedTools: (app.catalogApp.mappedTools || []).filter(tool => allowed?.has(tool.shortName)),
      },
    };
  });
}
