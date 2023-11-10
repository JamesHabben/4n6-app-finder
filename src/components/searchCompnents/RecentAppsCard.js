import React, { useMemo, useCallback } from 'react';
import { Card, Row, Col } from 'antd';

import AppTile from 'components/searchCompnents/AppTile';

function RecentAppsCard({ apps, tools, onAppClick }) {
  const sortedApps = useMemo(() => {
    return [...apps].sort((a, b) => {
      const dateA = new Date(a.dateAdded);
      const dateB = new Date(b.dateAdded);
      return dateB - dateA;  // Sort in descending order
    });
  }, [apps]);

  const recentApps = useMemo(() => {
    return sortedApps.slice(0, 6);  // Get the six most recent apps
  }, [sortedApps]);

  const handleTileClick = useCallback((app) => {
    window.heap.track('Recent App Clicked', { appName: app.name });

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
