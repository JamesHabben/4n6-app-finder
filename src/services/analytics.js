export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined' || typeof window.heap?.track !== 'function') {
    return;
  }

  window.heap.track(eventName, properties);
}
