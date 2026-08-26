import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Tabs, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PrivacyNote from 'components/blindSpots/PrivacyNote';
import InventoryTab from 'components/blindSpots/InventoryTab';
import ResultsDashboard from 'components/blindSpots/ResultsDashboard';
import ToolCoverageMatrix from 'components/blindSpots/ToolCoverageMatrix';
import AppDetailsModal from 'components/AppDetailsModal';
import { DataContext } from 'services/DataContext';
import { useBlindSpots } from 'services/blindSpots/BlindSpotsContext';
import { matchInstalledApps } from 'services/blindSpots/matchCatalogApps';
import { summarizeInventory } from 'services/blindSpots/summarizeInventory';

const { Paragraph, Title } = Typography;

function PageBlindSpotsResults() {
  const { analysis } = useBlindSpots();
  const { apps, tools } = useContext(DataContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedApp, setSelectedApp] = useState(null);

  const matchedApps = useMemo(() => {
    if (!analysis?.apps) {
      return [];
    }
    return matchInstalledApps(analysis.apps, apps, analysis.source?.platform);
  }, [analysis, apps]);

  const summary = useMemo(
    () => summarizeInventory(matchedApps, tools),
    [matchedApps, tools],
  );

  const openApp = useCallback((catalogApp) => {
    setSelectedApp(catalogApp);
  }, []);

  const closeApp = useCallback(() => {
    setSelectedApp(null);
  }, []);

  const tabItems = useMemo(() => [
    {
      key: 'inventory',
      label: 'Device info and inventory',
      children: (
        <InventoryTab
          device={analysis?.device}
          matchedApps={matchedApps}
          summary={summary}
          tools={tools}
          onOpenApp={openApp}
        />
      ),
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      children: <ResultsDashboard summary={summary} onOpenApp={openApp} />,
    },
    {
      key: 'coverage',
      label: 'Tool coverage',
      children: <ToolCoverageMatrix summary={summary} onOpenApp={openApp} />,
    },
  ], [analysis, matchedApps, openApp, summary, tools]);

  if (!analysis) {
    return (
      <div className="blind-spots-page">
        <div className="blind-spots-inner">
          <Title level={1} style={{ marginBottom: 0 }}>Blind Spots</Title>
          <PrivacyNote />
          <Paragraph>
            No file is loaded. Refreshing this page clears the file from memory on purpose.
          </Paragraph>
          <Button type="primary" onClick={() => navigate('/blind-spots')}>
            Choose a file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="blind-spots-page">
      <div className="blind-spots-inner">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/blind-spots')}
          style={{ paddingLeft: 0, marginBottom: '0.5rem' }}
        >
          Choose a different file
        </Button>
        <Title level={1} style={{ marginBottom: 0 }}>Blind Spots</Title>
        <Paragraph type="secondary" style={{ marginBottom: '0.25rem' }}>
          {analysis.source.fileName}
          {analysis.source.format ? ` · ${analysis.source.format}` : ''}
        </Paragraph>
        <PrivacyNote />
        <Tabs
          className="blind-spots-tabs"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </div>
      <AppDetailsModal
        app={selectedApp}
        open={Boolean(selectedApp)}
        onCancel={closeApp}
      />
    </div>
  );
}

export default PageBlindSpotsResults;
