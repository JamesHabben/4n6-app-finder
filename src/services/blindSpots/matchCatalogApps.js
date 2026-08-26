export const MATCH_METHODS = {
  BUNDLE_ID: 'bundle-id',
  PLAY_STORE_ID: 'play-store-id',
  DISPLAY_NAME: 'display-name',
  APPLE_PREFIX: 'apple-prefix',
  ANDROID_PREFIX: 'android-prefix',
};

export const MATCH_METHOD_LABELS = {
  [MATCH_METHODS.BUNDLE_ID]: 'Bundle ID against catalog aliases',
  [MATCH_METHODS.PLAY_STORE_ID]: 'Bundle ID against Play Store ID',
  [MATCH_METHODS.DISPLAY_NAME]: 'Display name against catalog app name',
  [MATCH_METHODS.APPLE_PREFIX]: 'Apple-prefixed display name',
  [MATCH_METHODS.ANDROID_PREFIX]: 'Android-prefixed display name',
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function playStoreIdFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    return new URL(url).searchParams.get('id') || '';
  } catch {
    const match = url.match(/[?&]id=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
  }
}

function setIfAbsent(map, key, app) {
  if (key && !map.has(key)) {
    map.set(key, app);
  }
}

export function buildCatalogIndex(apps) {
  const byAlias = new Map();
  const byPlayStoreId = new Map();
  const byAppName = new Map();

  apps.forEach(app => {
    setIfAbsent(byAppName, normalize(app.appName), app);

    (app.alternateNames || []).forEach(alias => {
      setIfAbsent(byAlias, normalize(alias), app);
    });
    (app.mappedArtifactNames || []).forEach(alias => {
      setIfAbsent(byAlias, normalize(alias), app);
    });

    setIfAbsent(byPlayStoreId, normalize(playStoreIdFromUrl(app.googlePlayUrl)), app);
  });

  return { byAlias, byPlayStoreId, byAppName };
}

function platformLabel(platform) {
  if (platform === 'apple') {
    return 'Apple';
  }
  if (platform === 'android') {
    return 'Android';
  }
  return '';
}

export function matchInstalledApp(installed, index, platform) {
  const bundleId = normalize(installed.bundleId);
  if (bundleId && index.byAlias.has(bundleId)) {
    return {
      catalogApp: index.byAlias.get(bundleId),
      method: MATCH_METHODS.BUNDLE_ID,
    };
  }
  if (bundleId && index.byPlayStoreId.has(bundleId)) {
    return {
      catalogApp: index.byPlayStoreId.get(bundleId),
      method: MATCH_METHODS.PLAY_STORE_ID,
    };
  }

  const name = normalize(installed.name);
  if (name && index.byAppName.has(name)) {
    return {
      catalogApp: index.byAppName.get(name),
      method: MATCH_METHODS.DISPLAY_NAME,
    };
  }

  const prefix = platformLabel(platform);
  if (name && prefix && !name.startsWith(`${normalize(prefix)} `)) {
    const prefixed = normalize(`${prefix} ${installed.name}`);
    if (index.byAppName.has(prefixed)) {
      return {
        catalogApp: index.byAppName.get(prefixed),
        method: platform === 'apple' ? MATCH_METHODS.APPLE_PREFIX : MATCH_METHODS.ANDROID_PREFIX,
      };
    }
  }

  return { catalogApp: null, method: null };
}

export function matchInstalledApps(installedApps, catalogApps, platform) {
  const index = buildCatalogIndex(catalogApps);
  return installedApps.map(app => {
    const { catalogApp, method } = matchInstalledApp(app, index, platform);
    return {
      ...app,
      catalogApp,
      matchMethod: method,
      tracked: Boolean(catalogApp),
    };
  });
}
