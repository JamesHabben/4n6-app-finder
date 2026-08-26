function toolCount(app) {
  return app.catalogApp?.mappedTools?.length || 0;
}

function appSortKey(app) {
  return app.name || app.bundleId || '';
}

function categoryLabel(app) {
  if (app.tracked) {
    return app.catalogApp?.category?.trim() || 'Uncategorized';
  }
  return app.genre?.trim() || 'Not in catalog';
}

function buildToolCountHistogram(trackedApps) {
  const maxObserved = trackedApps.reduce((max, app) => Math.max(max, toolCount(app)), 0);
  const bins = Array.from({ length: maxObserved + 1 }, (_, tools) => ({
    tools,
    label: tools === 1 ? '1 tool' : `${tools} tools`,
    count: 0,
  }));

  trackedApps.forEach((app) => {
    bins[toolCount(app)].count += 1;
  });

  return bins;
}

function buildOneHitGroups(trackedApps) {
  const groups = new Map();

  trackedApps.forEach((app) => {
    const mapped = app.catalogApp?.mappedTools || [];
    if (mapped.length !== 1) {
      return;
    }
    const tool = mapped[0];
    const existing = groups.get(tool.shortName) || {
      shortName: tool.shortName,
      longName: tool.longName,
      icon: tool.icon,
      apps: [],
    };
    existing.apps.push(app);
    groups.set(tool.shortName, existing);
  });

  return [...groups.values()]
    .map(group => ({
      ...group,
      apps: [...group.apps].sort((a, b) => appSortKey(a).localeCompare(appSortKey(b))),
    }))
    .sort((a, b) => (
      b.apps.length - a.apps.length
      || a.longName.localeCompare(b.longName)
    ));
}

function buildCategoryCounts(matchedApps) {
  const groups = new Map();

  matchedApps.forEach((app) => {
    const name = categoryLabel(app);
    const existing = groups.get(name) || {
      name,
      total: 0,
      supported: 0,
      uncovered: 0,
    };
    existing.total += 1;
    if (toolCount(app) > 0) {
      existing.supported += 1;
    } else {
      existing.uncovered += 1;
    }
    groups.set(name, existing);
  });

  return [...groups.values()].sort((a, b) => (
    b.total - a.total || a.name.localeCompare(b.name)
  ));
}

export function summarizeInventory(matchedApps, tools) {
  const total = matchedApps.length;
  const trackedApps = matchedApps.filter(app => app.tracked);
  const tracked = trackedApps.length;
  const supported = trackedApps.filter(app => toolCount(app) > 0).length;
  const oneHitGroups = buildOneHitGroups(trackedApps);

  const toolCounts = tools.map(tool => ({
    shortName: tool.toolShortName,
    longName: tool.toolLongName,
    icon: tool.icon,
    count: trackedApps.filter(app => (
      (app.catalogApp?.mappedTools || []).some(mapped => mapped.shortName === tool.toolShortName)
    )).length,
  })).sort((a, b) => b.count - a.count || a.longName.localeCompare(b.longName));

  return {
    total,
    tracked,
    supported,
    unknown: total - tracked,
    knownUnparsed: tracked - supported,
    trackedApps,
    toolCounts,
    toolCountHistogram: buildToolCountHistogram(trackedApps),
    oneHitGroups,
    oneHitCount: oneHitGroups.reduce((sum, group) => sum + group.apps.length, 0),
    categoryCounts: buildCategoryCounts(matchedApps),
  };
}

export function coverageRows(trackedApps, toolCounts) {
  return [...trackedApps]
    .map(app => {
      const supportedShortNames = new Set(
        (app.catalogApp?.mappedTools || []).map(tool => tool.shortName),
      );
      return {
        ...app,
        toolHits: toolCounts.map(tool => supportedShortNames.has(tool.shortName)),
        toolCount: supportedShortNames.size,
      };
    })
    .sort((a, b) => (
      b.toolCount - a.toolCount
      || (a.name || a.bundleId).localeCompare(b.name || b.bundleId)
    ));
}
