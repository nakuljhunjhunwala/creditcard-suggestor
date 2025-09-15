import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

type Slice = {
  label: string;
  value: number; // percentage 0-100
  color: string;
};

type DonutChartProps = {
  slices: Slice[];
};

export function DonutChart({ slices }: DonutChartProps) {
  const data = slices.map(s => ({ name: s.label, value: Math.max(0, s.value) }));
  const COLORS = slices.map(s => s.color);

  return (
    <div className="w-full" style={{ minWidth: 140, height: 160 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={50}
            outerRadius={70}
            paddingAngle={1}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any, _name, props: any) => [`${value}%`, props.payload.name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DonutChart;


