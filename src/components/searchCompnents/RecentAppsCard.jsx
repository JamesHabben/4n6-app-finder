import React, { useMemo, useCallback } from 'react';
import { Row, Col } from 'antd';

import AppTile from 'components/searchCompnents/AppTile';
import { trackEvent } from 'services/analytics';

function latestActivityDate(app) {
  const added = app.dateAdded ? new Date(app.dateAdded) : null;
  const updated = app.dateUpdated ? new Date(app.dateUpdated) : null;
  if (added && updated) return added > updated ? added : updated;
  return updated || added || new Date(0);
}

function RecentAppsCard({ apps, tools, onAppClick }) {
  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => latestActivityDate(b) - latestActivityDate(a));
  }, [apps]);

  const recentApps = useMemo(() => {
    return sortedApps.slice(0, 18);  // three rows of six on xl
  }, [sortedApps]);

  const handleTileClick = useCallback((app) => {
    trackEvent('Recent App Clicked', { appName: app.appName });

    if (onAppClick) {
      onAppClick(app);
    }
  }, [onAppClick]);

  return (
    <div>
      <h2>Recent App Updates</h2>
      <Row gutter={[16, 16]} justify={'center'}>
        {recentApps.map((app, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6} xl={4}>
            <AppTile app={app} tools={tools} onClick={() => handleTileClick(app)} />
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default RecentAppsCard;
