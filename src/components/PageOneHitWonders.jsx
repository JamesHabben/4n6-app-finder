import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Input, Table, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DataContext } from 'services/DataContext';

const { Paragraph, Title } = Typography;

function PageOneHitWonders() {
  const { apps } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTools = useMemo(
    () => searchParams.getAll('tool').filter(Boolean),
    [searchParams],
  );

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
    const tools = new Map();
    oneHitRows.forEach(app => {
      tools.set(app.toolShortName, app.toolName);
    });
    return [...tools.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([shortName, longName]) => ({ text: longName, value: shortName }));
  }, [oneHitRows]);

  const oneHitWonders = useMemo(() => (
    oneHitRows.filter(app => app.appName.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [oneHitRows, searchTerm]);

  const handleTableChange = useCallback((_pagination, filters) => {
    const nextTools = (filters.toolName || []).filter(Boolean);
    const nextParams = new URLSearchParams();
    nextTools.forEach(tool => nextParams.append('tool', tool));
    setSearchParams(nextParams, { replace: true });
  }, [setSearchParams]);

  const columns = [
    {
      title: 'App',
      dataIndex: 'appName',
      key: 'appName',
      sorter: (a, b) => a.appName.localeCompare(b.appName),
      render: appName => <Link to={`/?app=${encodeURIComponent(appName)}`}>{appName}</Link>,
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
      </div>
    </div>
  );
}

export default PageOneHitWonders;
