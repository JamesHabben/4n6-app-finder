// ListCard.js
import React from 'react';
import { Card, Col, Row } from 'antd';

function ListCard({ apps, dataKey, title, displayFunction }) {
  return (
    <div className='list-card'>
      <h2>{title}</h2>
      <Card style={{ width: '100%', marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          {apps.map((app, index) => (
            <Col key={index} xs={24} sm={12} md={8} lg={6}>
              <div className='property-value'>
                <strong>{app.appName}:</strong> {displayFunction ? displayFunction(app[dataKey]) : app[dataKey]}
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

export default ListCard;
