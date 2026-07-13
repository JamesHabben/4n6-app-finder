import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Input, Modal, Table, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DataContext } from 'services/DataContext';
import AppDetails from 'components/AppDetails';

const { Paragraph, Title } = Typography;

function buildSearchParams({ tools = [], appName }) {
  const nextParams = new URLSearchParams();
  tools.forEach(tool => nextParams.append('tool', tool));
  if (appName) {
    nextParams.set('app', appName);
  }
  return nextParams;
}

function PageOneHitWonders() {
  const { apps, tools } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTools = useMemo(
    () => searchParams.getAll('tool').filter(Boolean),
    [searchParams],
  );

  const selectedAppName = searchParams.get('app');

  const selectedApp = useMemo(() => {
    if (!selectedAppName) return null;
    return apps.find(
      app => app.appName.toLowerCase() === decodeURIComponent(selectedAppName).toLowerCase(),
    ) || null;
  }, [apps, selectedAppName]);

  const oneHitRows = useMemo(() => (
    apps
      .filter(app => app.mappedTools?.length === 1)
      .map(app => ({
        ...app,
        category: app.category || app.mappedCategories?.[0] || '—',
        toolName: app.mappedTools[0].longName,
        toolShortName: app.mappedTools[0].shortName,
      }))
      .sort((a, b) => a.appName.localeCompare(b.appName))
  ), [apps]);

  const toolFilters = useMemo(() => {
    const toolMap = new Map();
    oneHitRows.forEach(app => {
      toolMap.set(app.toolShortName, app.toolName);
    });
    return [...toolMap.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([shortName, longName]) => ({ text: longName, value: shortName }));
  }, [oneHitRows]);

  const oneHitWonders = useMemo(() => (
    oneHitRows.filter(app => app.appName.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [oneHitRows, searchTerm]);

  const handleTableChange = useCallback((_pagination, filters) => {
    const nextTools = (filters.toolName || []).filter(Boolean);
    setSearchParams(
      buildSearchParams({ tools: nextTools, appName: selectedAppName || undefined }),
      { replace: true },
    );
  }, [selectedAppName, setSearchParams]);

  const closeAppModal = useCallback(() => {
    setSearchParams(
      buildSearchParams({ tools: selectedTools }),
      { replace: true },
    );
  }, [selectedTools, setSearchParams]);

  const getAppHref = useCallback((appName) => {
    const params = buildSearchParams({ tools: selectedTools, appName });
    const query = params.toString();
    return query ? `?${query}` : '?';
  }, [selectedTools]);

  const columns = [
    {
      title: 'App',
      dataIndex: 'appName',
      key: 'appName',
      sorter: (a, b) => a.appName.localeCompare(b.appName),
      render: appName => <Link to={getAppHref(appName)}>{appName}</Link>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: 'Tool',
      dataIndex: 'toolName',
      key: 'toolName',
      sorter: (a, b) => a.toolName.localeCompare(b.toolName),
      filters: toolFilters,
      filteredValue: selectedTools.length ? selectedTools : null,
      filterMultiple: true,
      onFilter: (value, record) => record.toolShortName === value,
    },
  ];

  return (
    <div style={{ padding: '2rem 1rem', width: '100%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard')}
          style={{ paddingLeft: 0, marginBottom: '0.5rem' }}
        >
          Dashboard overview
        </Button>
        <Title level={1} style={{ marginBottom: 0 }}>One-Hit Wonders</Title>
        <Paragraph type="secondary">
          Apps currently parsed by only one forensic tool.
        </Paragraph>
        <Input.Search
          allowClear
          placeholder="Search apps"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          style={{ maxWidth: 360, marginBottom: '1rem' }}
        />
        <Table
          rowKey="appName"
          columns={columns}
          dataSource={oneHitWonders}
          onChange={handleTableChange}
          pagination={{ pageSize: 25, showSizeChanger: true }}
        />
        <Modal
          title="App Details"
          open={Boolean(selectedApp)}
          onCancel={closeAppModal}
          footer={null}
          width="80%"
        >
          {selectedApp && <AppDetails app={selectedApp} tools={tools} />}
        </Modal>
      </div>
    </div>
  );
}

export default PageOneHitWonders;
