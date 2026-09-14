import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, Input, Table, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DataContext } from 'services/DataContext';
import AppDetailsModal from 'components/AppDetailsModal';
import AppNameWithIcon from 'components/AppNameWithIcon';

const { Paragraph, Title } = Typography;

export const APP_LIST_PATH = '/dashboard/app-list';
export const ONE_HIT_PATH = '/dashboard/one-hit-wonders';
export const WISH_LIST_PATH = '/dashboard/wish-list';

const ALIAS_COUNTS = {
  [ONE_HIT_PATH]: ['1'],
  [WISH_LIST_PATH]: ['0'],
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function sameStringList(left, right) {
  return left.map(String).join('\0') === right.map(String).join('\0');
}

function buildSearchParams({
  tools = [],
  counts = [],
  appName,
  includeCounts,
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
}) {
  const nextParams = new URLSearchParams();
  if (includeCounts) {
    counts.forEach(count => nextParams.append('count', count));
  }
  tools.forEach(tool => nextParams.append('tool', tool));
  if (pageSize !== DEFAULT_PAGE_SIZE) {
    nextParams.set('pageSize', String(pageSize));
  }
  if (page !== DEFAULT_PAGE) {
    nextParams.set('page', String(page));
  }
  if (appName) {
    nextParams.set('app', appName);
  }
  return nextParams;
}

function searchFromParams(params) {
  const query = params.toString();
  return query ? `?${query}` : '';
}

function formatCountList(counts) {
  const nums = [...counts].map(Number).sort((a, b) => a - b);
  if (nums.length === 1) {
    return String(nums[0]);
  }
  if (nums.length === 2) {
    return `${nums[0]} or ${nums[1]}`;
  }
  return `${nums.slice(0, -1).join(', ')}, or ${nums.at(-1)}`;
}

function headingForCounts(counts) {
  if (counts.length === 1 && counts[0] === '0') {
    return {
      title: 'Wish List',
      subtitle: 'Apps not yet mapped to any forensic tool.',
    };
  }
  if (counts.length === 1 && counts[0] === '1') {
    return {
      title: 'One-Hit Wonders',
      subtitle: 'Apps currently parsed by only one forensic tool.',
    };
  }
  if (counts.length === 0) {
    return {
      title: 'App list',
      subtitle: 'Catalog apps by how many forensic tools parse them.',
    };
  }
  const countLabel = formatCountList(counts);
  const plural = counts.length !== 1 || counts[0] !== '1';
  return {
    title: `Apps parsed by ${countLabel} tool${plural ? 's' : ''}`,
    subtitle: 'Filtered by the number of mapped forensic tools.',
  };
}

function ToolCell({ tools }) {
  if (!tools?.length) {
    return '—';
  }

  return (
    <span className="app-list-tool-cell">
      {tools.map(tool => (
        <span key={tool.shortName} className="app-list-tool-item">
          <img src={`/images/${tool.icon}`} alt="" title={tool.longName} />
          {tools.length === 1 ? tool.longName : null}
        </span>
      ))}
    </span>
  );
}

function PageAppList() {
  const { apps } = useContext(DataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const impliedCounts = ALIAS_COUNTS[pathname];
  const includeCounts = !impliedCounts;

  const selectedTools = useMemo(
    () => searchParams.getAll('tool').filter(Boolean),
    [searchParams],
  );

  const selectedCounts = useMemo(() => {
    if (impliedCounts) {
      return impliedCounts;
    }
    return searchParams.getAll('count').filter(count => count !== '');
  }, [impliedCounts, searchParams]);

  const selectedPageSize = parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE);
  const selectedPage = parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE);

  const selectedAppName = searchParams.get('app');

  const selectedApp = useMemo(() => {
    if (!selectedAppName) return null;
    return apps.find(
      app => app.appName.toLowerCase() === decodeURIComponent(selectedAppName).toLowerCase(),
    ) || null;
  }, [apps, selectedAppName]);

  useEffect(() => {
    if (!impliedCounts) {
      return;
    }

    const queryCounts = searchParams.getAll('count').filter(count => count !== '');
    if (queryCounts.length === 0) {
      return;
    }

    const matchesAlias = (
      queryCounts.length === impliedCounts.length
      && queryCounts.every((count, index) => count === impliedCounts[index])
    );

    if (matchesAlias) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('count');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    navigate({ pathname: APP_LIST_PATH, search: searchFromParams(searchParams) }, { replace: true });
  }, [impliedCounts, navigate, searchParams, setSearchParams]);

  const rows = useMemo(() => (
    apps
      .map(app => ({
        ...app,
        category: app.category || app.mappedCategories?.[0] || '—',
        toolCount: app.mappedTools?.length || 0,
      }))
      .sort((a, b) => a.appName.localeCompare(b.appName))
  ), [apps]);

  const toolFilters = useMemo(() => {
    const toolMap = new Map();
    rows.forEach(app => {
      (app.mappedTools || []).forEach(tool => {
        toolMap.set(tool.shortName, tool.longName);
      });
    });
    return [...toolMap.entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([shortName, longName]) => ({ text: longName, value: shortName }));
  }, [rows]);

  const countFilters = useMemo(() => {
    const counts = new Set(rows.map(app => app.toolCount));
    return [...counts]
      .sort((a, b) => a - b)
      .map(count => ({ text: String(count), value: String(count) }));
  }, [rows]);

  const searchedRows = useMemo(() => (
    rows.filter(app => app.appName.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [rows, searchTerm]);

  const heading = headingForCounts(selectedCounts);

  const handleTableChange = useCallback((pagination, filters) => {
    const nextTools = (filters.toolName || []).filter(Boolean);
    const nextCounts = (filters.toolCount || [])
      .filter(count => count !== undefined && count !== null && count !== '')
      .map(String);
    const filtersChanged = (
      !sameStringList(nextTools, selectedTools)
      || !sameStringList(nextCounts, selectedCounts)
    );
    const nextPageSize = parsePositiveInt(pagination?.pageSize, selectedPageSize);
    const nextPage = filtersChanged
      ? DEFAULT_PAGE
      : parsePositiveInt(pagination?.current, selectedPage);
    const staysOnAlias = Boolean(
      impliedCounts
      && nextCounts.length === impliedCounts.length
      && nextCounts.every((count, index) => count === impliedCounts[index]),
    );
    const nextPath = staysOnAlias ? pathname : APP_LIST_PATH;
    const nextParams = buildSearchParams({
      tools: nextTools,
      counts: nextCounts,
      appName: selectedAppName || undefined,
      includeCounts: nextPath === APP_LIST_PATH,
      page: nextPage,
      pageSize: nextPageSize,
    });

    navigate({ pathname: nextPath, search: searchFromParams(nextParams) }, { replace: true });
  }, [
    impliedCounts,
    navigate,
    pathname,
    selectedAppName,
    selectedCounts,
    selectedPage,
    selectedPageSize,
    selectedTools,
  ]);

  const closeAppModal = useCallback(() => {
    const nextParams = buildSearchParams({
      tools: selectedTools,
      counts: selectedCounts,
      includeCounts,
      page: selectedPage,
      pageSize: selectedPageSize,
    });
    setSearchParams(nextParams, { replace: true });
  }, [
    includeCounts,
    selectedCounts,
    selectedPage,
    selectedPageSize,
    selectedTools,
    setSearchParams,
  ]);

  const getAppHref = useCallback((appName) => {
    const params = buildSearchParams({
      tools: selectedTools,
      counts: selectedCounts,
      appName,
      includeCounts,
      page: selectedPage,
      pageSize: selectedPageSize,
    });
    const query = params.toString();
    return query ? `?${query}` : '?';
  }, [includeCounts, selectedCounts, selectedPage, selectedPageSize, selectedTools]);

  const columns = [
    {
      title: 'App',
      dataIndex: 'appName',
      key: 'appName',
      sorter: (a, b) => a.appName.localeCompare(b.appName),
      render: (appName, record) => (
        <AppNameWithIcon icon={record.icon}>
          <Link to={getAppHref(appName)}>{appName}</Link>
        </AppNameWithIcon>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: 'Tools',
      dataIndex: 'toolCount',
      key: 'toolCount',
      sorter: (a, b) => a.toolCount - b.toolCount,
      filters: countFilters,
      filteredValue: selectedCounts.length ? selectedCounts : null,
      filterMultiple: true,
      onFilter: (value, record) => String(record.toolCount) === String(value),
    },
    {
      title: 'Tool',
      dataIndex: 'mappedTools',
      key: 'toolName',
      filters: toolFilters,
      filteredValue: selectedTools.length ? selectedTools : null,
      filterMultiple: true,
      onFilter: (value, record) => (record.mappedTools || []).some(tool => tool.shortName === value),
      render: (tools) => <ToolCell tools={tools} />,
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
        <Title level={1} style={{ marginBottom: 0 }}>{heading.title}</Title>
        <Paragraph type="secondary">
          {heading.subtitle}
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
          dataSource={searchedRows}
          onChange={handleTableChange}
          pagination={{
            current: selectedPage,
            pageSize: selectedPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            showSizeChanger: true,
          }}
        />
        <AppDetailsModal
          app={selectedApp}
          open={Boolean(selectedApp)}
          onCancel={closeAppModal}
        />
      </div>
    </div>
  );
}

export default PageAppList;
