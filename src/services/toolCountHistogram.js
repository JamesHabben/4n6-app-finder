export function buildToolCountHistogram(items, getCount) {
  const counts = items.map(item => getCount(item) || 0);
  const maxObserved = counts.reduce((max, n) => Math.max(max, n), 0);
  const bins = Array.from({ length: maxObserved + 1 }, (_, tools) => ({
    tools,
    label: tools, // === 1 ? '1 tool' : `${tools} tools`,
    count: 0,
  }));

  counts.forEach((n) => {
    bins[n].count += 1;
  });

  return bins;
}
