import { useState } from 'react';
import { Card, Segmented, Space, Tag, Typography, Input } from 'antd';
import { Box, Table as TableIcon, Dumbbell } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';
import { HumanSkeleton3D } from './HumanSkeleton3D';
import { JointRom2D } from './JointRom2D';
import { PHYSIO_ORTHO_CONFIG } from './config';
import { SessionCourseCard } from '../../features/sessions/SessionCourseCard';

const { Text, Title } = Typography;

export function PhysioOrthoWorkspace(props: SpecialtyComponentProps) {
  const [viewMode, setViewMode] = useState<'3d_skeleton' | '2d_goniometry'>('3d_skeleton');
  const [homeExercisePlan, setHomeExercisePlan] = useState(
    '1. Hamstring static stretch: 3 sets x 30 sec hold\n2. Quad sets with towel roll under knee: 3 x 15 reps\n3. Straight leg raises: 3 x 10 reps with 2 sec pause'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Specialty Header */}
      <Card
        size="small"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          border: 'none',
          color: '#ffffff',
          borderRadius: 10,
        }}
        bodyStyle={{ padding: '12px 18px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Title level={5} style={{ color: '#ffffff', margin: 0 }}>
                {PHYSIO_ORTHO_CONFIG.nameEn}
              </Title>
              <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
                {PHYSIO_ORTHO_CONFIG.nameAr}
              </Tag>
            </div>
            <Text style={{ color: '#d1fae5', fontSize: 12 }}>
              {PHYSIO_ORTHO_CONFIG.taglineEn}
            </Text>
          </div>

          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as any)}
            options={[
              { value: '3d_skeleton', label: <Space size={4}><Box size={13} /> 3D Skeleton / Joints</Space> },
              { value: '2d_goniometry', label: <Space size={4}><TableIcon size={13} /> 2D ROM Goniometry</Space> },
            ]}
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#ffffff' }}
          />
        </div>
      </Card>

      {/* Visualizers */}
      {viewMode === '3d_skeleton' && <HumanSkeleton3D {...props} />}
      {viewMode === '2d_goniometry' && <JointRom2D {...props} />}

      {/* Session Course Tracking */}
      <SessionCourseCard
        patientId={props.patientId || 'demo-patient'}
        clinicType="physiotherapy"
      />

      {/* Home Exercise Prescription (HEP) */}
      <Card
        size="small"
        title={
          <Space>
            <Dumbbell size={15} color="#059669" />
            <span style={{ fontWeight: 600 }}>Home Exercise Prescription (HEP) &amp; Functional Protocol</span>
          </Space>
        }
      >
        <Input.TextArea
          rows={3}
          value={homeExercisePlan}
          onChange={(e) => setHomeExercisePlan(e.target.value)}
          placeholder="Prescribe sets, repetitions, holds, and frequency..."
        />
      </Card>
    </div>
  );
}
