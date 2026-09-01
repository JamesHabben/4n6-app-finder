import React from 'react';
import { Card, Col, Collapse, Progress, Row, Statistic, Typography } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppNameCell } from 'components/blindSpots/TrackedAppName';
import ToolsPerAppChart from 'components/ToolsPerAppChart';

const { Text } = Typography;

function percentOf(part, total) {
  if (!total) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

const COVERAGE_SLICES = [
  { key: 'supported', name: 'Supported', fill: '#1677ff' },
  { key: 'unparsed', name: 'Tracked with no tools', fill: '#faad14' },
  { key: 'unknown', name: 'Not in catalog', fill: '#d9d9d9' },
];

function CoverageDonut({ total, supported, knownUnparsed, unknown }) {
  const slices = [
    { ...COVERAGE_SLICES[0], value: supported },
    { ...COVERAGE_SLICES[1], value: knownUnparsed },
    { ...COVERAGE_SLICES[2], value: unknown },
  ].filter(slice => slice.value > 0);

  return (
    <div className="blind-spots-coverage-visual">
      <div className="blind-spots-coverage-donut" aria-hidden={total === 0}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="80%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
            >
              {slices.map(slice => (
                <Cell key={slice.key} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} app${value === 1 ? '' : 's'}`,
                name,
              ]}
              contentStyle={{ color: '#141414' }}
              itemStyle={{ color: '#141414' }}
              labelStyle={{ color: '#141414' }}
              wrapperStyle={{ zIndex: 2 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="blind-spots-coverage-donut-center">
          <strong>{percentOf(supported, total)}%</strong>
          <span>supported</span>
        </div>
      </div>
      <div className="blind-spots-coverage-legend">
        <Text>
          <span className="blind-spots-legend-swatch supported" />
          {supported} supported by at least one tool ({percentOf(supported, total)}%)
        </Text>
        <Text>
          <span className="blind-spots-legend-swatch unparsed" />
          {knownUnparsed} tracked with no tools ({percentOf(knownUnparsed, total)}%)
        </Text>
        <Text>
          <span className="blind-spots-legend-swatch unknown" />
          {unknown} not in catalog ({percentOf(unknown, total)}%)
        </Text>
      </div>
    </div>
  );
}

function CategoryChart({ categories }) {
  const height = Math.max(220, categories.length * 28);

  return (
    <div className="blind-spots-chart-categories" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={categories}
          margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Legend />
          <Bar dataKey="supported" name="Supported" stackId="coverage" fill="#1677ff" />
          <Bar dataKey="uncovered" name="Uncovered" stackId="coverage" fill="#d9d9d9" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function OneHitList({ groups, onOpenApp }) {
  if (groups.length === 0) {
    return (
      <Text type="secondary">
        No tracked apps on this device are parsed by only one tool.
      </Text>
    );
  }

  return (
    <Collapse
      size="small"
      defaultActiveKey={groups.slice(0, 2).map(group => group.shortName)}
      items={groups.map(group => ({
        key: group.shortName,
        label: (
          <span className="blind-spots-one-hit-label">
            <img src={`/images/${group.icon}`} alt="" />
            {group.longName}
          </span>
        ),
        extra: group.apps.length,
        children: (
          <ul className="blind-spots-one-hit-apps">
            {group.apps.map(app => (
              <li key={app.bundleId || app.name}>
                <AppNameCell row={app} onOpen={onOpenApp} />
              </li>
            ))}
          </ul>
        ),
      }))}
    />
  );
}

function ResultsDashboard({ summary, platformLabel, onOpenApp }) {
  const {
    total,
    tracked,
    supported,
    unknown,
    knownUnparsed,
    toolCounts,
    toolCountHistogram,
    oneHitGroups,
    oneHitCount,
    categoryCounts,
  } = summary;

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="Inventory coverage">
          <div className="blind-spots-stat-row">
            <Statistic title="Total apps" value={total} />
            <Statistic title="Tracked" value={tracked} />
            <Statistic title="Supported" value={supported} />
          </div>
          <CoverageDonut
            total={total}
            supported={supported}
            knownUnparsed={knownUnparsed}
            unknown={unknown}
          />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Tools on this device">
          <Text type="secondary" className="blind-spots-tool-counts-note">
            Each bar is that tool&apos;s share of {tracked} tracked app{tracked === 1 ? '' : 's'}
            {platformLabel ? ` on ${platformLabel}` : ''}.
          </Text>
          <ul className="blind-spots-tool-counts">
            {toolCounts.map(tool => {
              const percent = tracked ? (tool.count / tracked) * 100 : 0;
              return (
                <li key={tool.shortName}>
                  <span className="blind-spots-tool-counts-name">
                    <img
                      src={`/images/${tool.icon}`}
                      alt=""
                      title={tool.longName}
                    />
                    {tool.longName}
                  </span>
                  <Progress
                    percent={percent}
                    size="small"
                    format={() => `${tool.count} / ${tracked}`}
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Tools per tracked app">
          <Text type="secondary" className="blind-spots-tool-counts-note">
            How many forensic tools parse each of the {tracked} tracked apps
            {platformLabel ? ` on ${platformLabel}` : ''}.
          </Text>
          <ToolsPerAppChart histogram={toolCountHistogram} seriesName="Tracked" />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title={`One-hit apps on this device (${oneHitCount})`}>
          <Text type="secondary" className="blind-spots-tool-counts-note">
            Tracked apps parsed by exactly one tool
            {platformLabel ? ` on ${platformLabel}` : ''}. These are the operational blind spots.
          </Text>
          <OneHitList groups={oneHitGroups} onOpenApp={onOpenApp} />
        </Card>
      </Col>
      <Col xs={24}>
        <Card title="Categories on this device">
          <Text type="secondary" className="blind-spots-tool-counts-note">
            Tracked apps use the catalog category. Apps not in the catalog use the backup genre when it is present.
          </Text>
          <CategoryChart categories={categoryCounts} />
        </Card>
      </Col>
    </Row>
  );
}

export default ResultsDashboard;
