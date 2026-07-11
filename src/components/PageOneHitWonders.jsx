import React, { useContext, useMemo, useState } from 'react';
import { Button, Input, Table, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { DataContext } from 'services/DataContext';

const { Paragraph, Title } = Typography;

function PageOneHitWonders() {
  const { apps } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const oneHitWonders = useMemo(() => (
    apps
      .filter(app => app.mappedTools?.length === 1)
      .map(app => ({
        ...app,
        category: app.category || app.mappedCategories?.[0] || '—',
        toolName: app.mappedTools[0].longName,
      }))
      .filter(app => app.appName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.appName.localeCompare(b.appName))
  ), [apps, searchTerm]);

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
          pagination={{ pageSize: 25, showSizeChanger: true }}
        />
      </div>
    </div>
  );
}

export default PageOneHitWonders;
