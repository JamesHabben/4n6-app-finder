import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Spin, Tabs, Typography } from 'antd';
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
import {
  analysisPlatformLabel,
  applyPlatformToolFilter,
} from 'services/blindSpots/filterToolsByPlatform';

const { Paragraph, Title } = Typography;

function PageBlindSpotsResults() {
  const { analysis } = useBlindSpots();
  const { apps, tools, loadToolArtifacts, isLoadingTools, appByName } = useContext(DataContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [selectedApp, setSelectedApp] = useState(null);
  const [artifactLists, setArtifactLists] = useState(null);
  const [artifactsError, setArtifactsError] = useState('');

  useEffect(() => {
    if (isLoadingTools || !tools.length) {
      return undefined;
    }

    let cancelled = false;
    setArtifactsError('');
    setArtifactLists(null);

    Promise.all(
      tools.map(async (tool) => {
        const artifacts = await loadToolArtifacts(tool);
        return [tool.toolShortName, artifacts];
      }),
    )
      .then((entries) => {
        if (!cancelled) {
          setArtifactLists(Object.fromEntries(entries));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setArtifactsError(err?.message || 'Could not load tool artifact lists.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoadingTools, tools, loadToolArtifacts]);

  const platform = analysis?.source?.platform;
  const platformLabel = analysisPlatformLabel(platform);
  const artifactsReady = artifactLists != null;

  const matchedApps = useMemo(() => {
    if (!analysis?.apps || !artifactsReady) {
      return [];
    }
    const matched = matchInstalledApps(analysis.apps, apps, platform);
    return applyPlatformToolFilter(matched, tools, artifactLists, platform);
  }, [analysis, apps, artifactLists, artifactsReady, platform, tools]);

  const summary = useMemo(
    () => summarizeInventory(matchedApps, tools),
    [matchedApps, tools],
  );

  const openApp = useCallback((catalogApp) => {
    setSelectedApp(appByName?.get(catalogApp.appName) || catalogApp);
  }, [appByName]);

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
          platformLabel={platformLabel}
          onOpenApp={openApp}
        />
      ),
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      children: (
        <ResultsDashboard
          summary={summary}
          platformLabel={platformLabel}
          onOpenApp={openApp}
        />
      ),
    },
    {
      key: 'coverage',
      label: 'Tool coverage',
      children: (
        <ToolCoverageMatrix
          summary={summary}
          platformLabel={platformLabel}
          onOpenApp={openApp}
        />
      ),
    },
  ], [analysis, matchedApps, openApp, platformLabel, summary, tools]);

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
          {platformLabel ? ` · ${platformLabel}` : ''}
        </Paragraph>
        <PrivacyNote />
        {artifactsError && (
          <Alert
            type="error"
            showIcon
            message={artifactsError}
            style={{ marginBottom: '1rem' }}
          />
        )}
        <Spin
          spinning={!artifactsReady && !artifactsError}
          description="Loading tool coverage for this platform…"
        >
          {artifactsReady && (
            <Tabs
              className="blind-spots-tabs"
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          )}
        </Spin>
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
