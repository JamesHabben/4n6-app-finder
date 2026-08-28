import React, { useMemo, useState } from 'react';
import { Input, Table, Typography } from 'antd';
import DeviceSummary from 'components/blindSpots/DeviceSummary';
import { AppNameCell } from 'components/blindSpots/TrackedAppName';

const { Paragraph, Title } = Typography;

function ToolIcons({ tools }) {
  if (!tools?.length) {
    return '—';
  }

  return (
    <span className="blind-spots-tool-icons">
      {tools.map(tool => (
        <img
          src={`/images/${tool.icon}`}
          alt={`${tool.longName} icon`}
          title={tool.longName}
          key={tool.shortName}
        />
      ))}
    </span>
  );
}

function toolShortNames(record) {
  return new Set((record.catalogApp?.mappedTools || []).map(tool => tool.shortName));
}

function parseToolFilterValues(values = []) {
  const has = [];
  const missing = [];

  values.forEach(value => {
    if (typeof value !== 'string') {
      return;
    }
    if (value.startsWith('has:')) {
      has.push(value.slice(4));
    } else if (value.startsWith('not:')) {
      missing.push(value.slice(4));
    }
  });

  return { has, missing };
}

function appMatchesToolFilters(record, values) {
  const { has, missing } = parseToolFilterValues(values);
  if (!has.length && !missing.length) {
    return true;
  }

  const shortNames = toolShortNames(record);
  if (has.length && !has.some(id => shortNames.has(id))) {
    return false;
  }
  if (missing.some(id => shortNames.has(id))) {
    return false;
  }
  return true;
}

function appMatchesTrackedFilter(record, values) {
  if (!values?.length) {
    return true;
  }
  return values.some(value => (record.tracked ? 'yes' : 'no') === value);
}

function InventoryTab({ device, matchedApps, summary, tools, platformLabel, onOpenApp }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [trackedFilterValues, setTrackedFilterValues] = useState([]);
  const [toolFilterValues, setToolFilterValues] = useState([]);

  const toolFilters = useMemo(() => {
    const children = tools.map(tool => ({
      text: tool.toolLongName,
      value: tool.toolShortName,
    }));

    return [
      {
        text: 'Has tool',
        value: 'has',
        children: children.map(tool => ({
          text: tool.text,
          value: `has:${tool.value}`,
        })),
      },
      {
        text: 'Missing tool',
        value: 'not',
        children: children.map(tool => ({
          text: tool.text,
          value: `not:${tool.value}`,
        })),
      },
    ];
  }, [tools]);

  const filteredApps = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    const searched = !value
      ? matchedApps
      : matchedApps.filter(app => (
        (app.name || '').toLowerCase().includes(value)
        || app.bundleId.toLowerCase().includes(value)
        || (app.publisher || '').toLowerCase().includes(value)
        || (app.catalogApp?.appName || '').toLowerCase().includes(value)
      ));

    return searched
      .filter(app => appMatchesTrackedFilter(app, trackedFilterValues))
      .filter(app => appMatchesToolFilters(app, toolFilterValues));
  }, [matchedApps, searchTerm, trackedFilterValues, toolFilterValues]);

  const columns = useMemo(() => [
    {
      title: 'App',
      dataIndex: 'name',
      key: 'name',
      filteredValue: null,
      sorter: (a, b) => (a.name || a.bundleId).localeCompare(b.name || b.bundleId),
      render: (name, row) => <AppNameCell row={row} onOpen={onOpenApp} />,
    },
    {
      title: 'Tracked',
      dataIndex: 'tracked',
      key: 'tracked',
      width: 110,
      filters: [
        { text: 'Yes', value: 'yes' },
        { text: 'No', value: 'no' },
      ],
      filterMultiple: false,
      filteredValue: trackedFilterValues.length ? trackedFilterValues : null,
      onFilter: () => true,
      sorter: (a, b) => Number(b.tracked) - Number(a.tracked),
      render: tracked => (tracked ? 'Yes' : 'No'),
    },
    {
      title: 'Tools',
      key: 'tools',
      filters: toolFilters,
      filterMode: 'tree',
      filterMultiple: true,
      filterSearch: true,
      filteredValue: toolFilterValues.length ? toolFilterValues : null,
      onFilter: () => true,
      sorter: (a, b) => (
        (a.catalogApp?.mappedTools?.length || 0) - (b.catalogApp?.mappedTools?.length || 0)
      ),
      render: (_, row) => <ToolIcons tools={row.catalogApp?.mappedTools} />,
    },
    {
      title: 'Bundle ID',
      dataIndex: 'bundleId',
      key: 'bundleId',
      filteredValue: null,
      sorter: (a, b) => a.bundleId.localeCompare(b.bundleId),
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 140,
      filteredValue: null,
      sorter: (a, b) => (a.version || '').localeCompare(b.version || ''),
      render: version => version || '—',
    },
    {
      title: 'Publisher',
      dataIndex: 'publisher',
      key: 'publisher',
      filteredValue: null,
      sorter: (a, b) => (a.publisher || '').localeCompare(b.publisher || ''),
      render: publisher => publisher || '—',
    },
  ], [onOpenApp, trackedFilterValues, toolFilterValues, toolFilters]);

  return (
    <div>
      <DeviceSummary device={device} />
      <div className="blind-spots-apps">
        <Title level={3} style={{ marginBottom: '0.25rem' }}>
          Installed apps
        </Title>
        <Paragraph type="secondary">
          {summary.total} app{summary.total === 1 ? '' : 's'} from the file.
          {' '}
          {summary.tracked} tracked in the catalog, {summary.supported} supported by at least one tool
          {platformLabel ? ` on ${platformLabel}` : ''}.
          Tool icons are limited to this file&apos;s platform.
          This is the user-app list recorded in the backup, not a complete filesystem inventory.
          System apps and apps excluded from backup may be absent.
        </Paragraph>
        <Input.Search
          allowClear
          placeholder="Search name, bundle ID, or publisher"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          style={{ maxWidth: 420, marginBottom: '1rem' }}
        />
        <Table
          rowKey="bundleId"
          columns={columns}
          dataSource={filteredApps}
          onChange={(_pagination, filters) => {
            setTrackedFilterValues(filters.tracked || []);
            setToolFilterValues(filters.tools || []);
          }}
          pagination={{ pageSize: 25, showSizeChanger: true }}
          scroll={{ x: 900 }}
        />
      </div>
    </div>
  );
}

export default InventoryTab;
