import React from 'react';
import { Card } from 'antd';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

function ListBarCard({ items, nameKey, dataKey, title, displayFunction }) {
  const data = items.map(item => ({
    name: item[nameKey],
    [dataKey]: displayFunction ? displayFunction(item) : displayFunction(item[dataKey]),
  }));

  return (
    <Card title={title} style={{ margin: '1rem 0' }}>
      <BarChart
        width={400}
        height={400}
        layout="vertical"
        data={data}
        margin={{
          top: 0, right: 0, left: 0, bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 'dataMax + 1']} />
        <YAxis dataKey="name" type="category" width={200} />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#8884d8" />
      </BarChart>
    </Card>
  );
}

export default ListBarCard;
