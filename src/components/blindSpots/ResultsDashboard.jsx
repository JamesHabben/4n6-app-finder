import React from 'react';
import { Card, Col, Collapse, Progress, Row, Statistic, Typography } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TrackedAppName from 'components/blindSpots/TrackedAppName';

const { Text } = Typography;

function barWidth(count, total) {
  if (!total) {
    return '0%';
  }
  return `${(count / total) * 100}%`;
}

function ToolsPerAppChart({ histogram }) {
  return (
    <div className="blind-spots-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" interval={0} />
          <YAxis allowDecimals={false} width={32} />
          <Tooltip
            formatter={(value) => [`${value} app${value === 1 ? '' : 's'}`, 'Tracked']}
          />
          <Bar dataKey="count" fill="#1677ff" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
                <TrackedAppName row={app} onOpen={onOpenApp} />
              </li>
            ))}
          </ul>
        ),
      }))}
    />
  );
}

function ResultsDashboard({ summary, onOpenApp }) {
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
          <div className="blind-spots-coverage-bar" aria-hidden={total === 0}>
            <span
              className="blind-spots-coverage-bar-supported"
              style={{ width: barWidth(supported, total) }}
              title={`${supported} supported`}
            />
            <span
              className="blind-spots-coverage-bar-unparsed"
              style={{ width: barWidth(knownUnparsed, total) }}
              title={`${knownUnparsed} tracked with no tools`}
            />
            <span
              className="blind-spots-coverage-bar-unknown"
              style={{ width: barWidth(unknown, total) }}
              title={`${unknown} not in catalog`}
            />
          </div>
          <div className="blind-spots-coverage-legend">
            <Text>
              <span className="blind-spots-legend-swatch supported" />
              {supported} supported by at least one tool
            </Text>
            <Text>
              <span className="blind-spots-legend-swatch unparsed" />
              {knownUnparsed} tracked with no tools
            </Text>
            <Text>
              <span className="blind-spots-legend-swatch unknown" />
              {unknown} not in catalog
            </Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Tools on this device">
          <Text type="secondary" className="blind-spots-tool-counts-note">
            Each bar is that tool&apos;s share of {tracked} tracked app{tracked === 1 ? '' : 's'}.
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
            How many forensic tools parse each of the {tracked} tracked apps.
          </Text>
          <ToolsPerAppChart histogram={toolCountHistogram} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title={`One-hit apps on this device (${oneHitCount})`}>
          <Text type="secondary" className="blind-spots-tool-counts-note">
            Tracked apps parsed by exactly one tool. These are the operational blind spots.
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
