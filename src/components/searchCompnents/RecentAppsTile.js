import React, { useMemo } from 'react';
import { Card, Row, Col } from 'antd';

import AppTile from 'components/searchCompnents/AppTile';

function RecentAppsTile({ apps, tools, onAppClick }) {
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

  return (
    <div>
      <h2>Recent App Updates</h2>
      <Row gutter={[16, 16]} justify={'center'}>
        {recentApps.map((app, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6} xl={4}>
            <AppTile app={app} tools={tools} onClick={onAppClick} />
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default RecentAppsTile;
