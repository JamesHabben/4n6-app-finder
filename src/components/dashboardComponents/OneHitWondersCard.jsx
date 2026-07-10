import React from 'react';
import { Card, Progress, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

function OneHitWondersCard({ oneHitCount, totalApps }) {
  const navigate = useNavigate();
  const percent = totalApps > 0 ? Number(((oneHitCount / totalApps) * 100).toFixed(1)) : 0;

  return (
    <Card
      title="One-Hit Wonders"
      hoverable
      onClick={() => navigate('/dashboard/one-hit-wonders')}
      style={{ margin: '1rem 0', width: 432, cursor: 'pointer' }}
      bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
    >
      <Progress
        type="circle"
        percent={percent}
        size={220}
        format={() => (
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 600 }}>{oneHitCount}</div>
            <div style={{ fontSize: '0.9rem' }}>of {totalApps} apps</div>
          </div>
        )}
      />
      <Text>{percent}% are parsed by only one tool</Text>
      <Text type="secondary">View apps</Text>
    </Card>
  );
}

export default OneHitWondersCard;
