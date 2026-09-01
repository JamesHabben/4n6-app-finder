import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function barFill(tools) {
  if (tools === 0) {
    return '#d9d9d9';
  }
  if (tools === 1) {
    return '#faad14';
  }
  return '#1677ff';
}

function ToolsPerAppChart({ histogram, seriesName = 'Apps' }) {
  return (
    <div className="tools-per-app-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" interval={0} />
          <YAxis allowDecimals={false} width={32} />
          <Tooltip
            formatter={(value) => [
              `${value} app${value === 1 ? '' : 's'}`,
              seriesName,
            ]}
            contentStyle={{ color: '#141414' }}
            itemStyle={{ color: '#141414' }}
            labelStyle={{ color: '#141414' }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {histogram.map(bin => (
              <Cell key={bin.tools} fill={barFill(bin.tools)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ToolsPerAppChart;
