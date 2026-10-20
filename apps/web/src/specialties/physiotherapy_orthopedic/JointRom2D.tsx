import { useState } from 'react';
import { Card, Table, Typography, Tag } from 'antd';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

interface MovementTest {
  key: string;
  joint: string;
  movement: string;
  normDeg: number;
  measuredDeg: number;
  mrcGrade: number; // 0 to 5
}

const DEFAULT_MOVEMENTS: MovementTest[] = [
  { key: 'cerv_flex', joint: 'Cervical Spine', movement: 'Flexion', normDeg: 60, measuredDeg: 45, mrcGrade: 4 },
  { key: 'cerv_ext', joint: 'Cervical Spine', movement: 'Extension', normDeg: 75, measuredDeg: 50, mrcGrade: 4 },
  { key: 'sh_flex_l', joint: 'Left Shoulder', movement: 'Flexion', normDeg: 180, measuredDeg: 110, mrcGrade: 3 },
  { key: 'sh_abd_l', joint: 'Left Shoulder', movement: 'Abduction', normDeg: 180, measuredDeg: 95, mrcGrade: 3 },
  { key: 'knee_flex_l', joint: 'Left Knee', movement: 'Flexion', normDeg: 135, measuredDeg: 75, mrcGrade: 4 },
  { key: 'lumbar_flex', joint: 'Lumbar Spine', movement: 'Forward Bend (Schober)', normDeg: 15, measuredDeg: 8, mrcGrade: 5 },
];

export function JointRom2D(_props: SpecialtyComponentProps) {
  const [data] = useState<MovementTest[]>(DEFAULT_MOVEMENTS);

  const columns = [
    {
      title: 'Joint Complex',
      dataIndex: 'joint',
      key: 'joint',
      render: (t: string) => <Text strong>{t}</Text>,
    },
    {
      title: 'Action / Plane',
      dataIndex: 'movement',
      key: 'movement',
    },
    {
      title: 'Normal Arc',
      dataIndex: 'normDeg',
      key: 'normDeg',
      render: (v: number) => `${v}°`,
    },
    {
      title: 'Measured ROM (°)',
      dataIndex: 'measuredDeg',
      key: 'measuredDeg',
      render: (_: any, r: MovementTest) => {
        const pct = Math.round((r.measuredDeg / r.normDeg) * 100);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Text style={{ minWidth: 45 }}>{r.measuredDeg}°</Text>
            <Tag color={pct < 60 ? 'red' : pct < 85 ? 'orange' : 'green'}>{pct}%</Tag>
          </div>
        );
      },
    },
    {
      title: 'MRC Muscle Strength',
      dataIndex: 'mrcGrade',
      key: 'mrcGrade',
      render: (_: any, r: MovementTest) => (
        <Tag color="blue">Grade {r.mrcGrade} / 5</Tag>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title="2D Goniometric Range of Motion &amp; Oxford MRC Muscle Grading"
    >
      <Table
        dataSource={data}
        columns={columns}
        pagination={false}
        size="small"
      />
    </Card>
  );
}
