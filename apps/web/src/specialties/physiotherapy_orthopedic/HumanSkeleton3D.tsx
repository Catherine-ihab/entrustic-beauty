import { useState, useRef } from 'react';
import { Card, Tag, Space, Typography, Button, Modal, Slider, Input, Segmented } from 'antd';
import { RotateCw, Activity, Sparkles, Layers, Eye, ZoomIn, ZoomOut } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

export type ViewMode = 'composite' | 'muscles' | 'skeleton' | 'split';

export interface AnatomicalHotspot {
  id: string;
  name: string;
  nameAr: string;
  type: 'joint' | 'muscle';
  // Position percentage on image [x%, y%]
  x: number;
  y: number;
  vasPain: number; // 0 - 10
  condition?: string;
  notes?: string;
}

const DEFAULT_HOTSPOTS: AnatomicalHotspot[] = [
  // Joints & Spine
  { id: 'cervical_spine', name: 'Cervical Spine (C1-C7)', nameAr: 'الفقرات العنقية', type: 'joint', x: 50, y: 11, vasPain: 5, condition: 'C5-C6 Facet Syndrome' },
  { id: 'shoulder_l', name: 'Left Shoulder (Glenohumeral)', nameAr: 'مفصل الكتف الأيسر', type: 'joint', x: 33, y: 18, vasPain: 6, condition: 'Subacromial Impingement' },
  { id: 'shoulder_r', name: 'Right Shoulder (Glenohumeral)', nameAr: 'مفصل الكتف الأيمن', type: 'joint', x: 67, y: 18, vasPain: 0 },
  { id: 'sternum', name: 'Sternum & Costal Cartilage', nameAr: 'عظمة القص والغضاريف الضلعية', type: 'joint', x: 50, y: 26, vasPain: 2, condition: 'Costochondritis' },
  { id: 'elbow_l', name: 'Left Elbow (Humeroulnar)', nameAr: 'مفصل الكوع الأيسر', type: 'joint', x: 26, y: 39, vasPain: 0 },
  { id: 'elbow_r', name: 'Right Elbow (Common Extensor)', nameAr: 'الكوع الأيمن (تنس إلبو)', type: 'joint', x: 74, y: 39, vasPain: 4, condition: "Lateral Epicondylitis ('Tennis Elbow')" },
  { id: 'lumbar_spine', name: 'Lumbar Spine (L4-S1)', nameAr: 'الفقرات القطنية L4-S1', type: 'joint', x: 50, y: 46, vasPain: 7, condition: 'L5-S1 Disc Bulge with Radiculopathy' },
  { id: 'wrist_l', name: 'Left Radiocarpal Wrist', nameAr: 'رسغ اليد الأيسر', type: 'joint', x: 19, y: 55, vasPain: 0 },
  { id: 'wrist_r', name: 'Right Radiocarpal Wrist', nameAr: 'رسغ اليد الأيمن', type: 'joint', x: 81, y: 55, vasPain: 0 },
  { id: 'hip_l', name: 'Left Acetabulofemoral (Hip)', nameAr: 'مفصل الفخذ والحوض الأيسر', type: 'joint', x: 42, y: 56, vasPain: 0 },
  { id: 'hip_r', name: 'Right Acetabulofemoral (Hip)', nameAr: 'مفصل الفخذ والحوض الأيمن', type: 'joint', x: 58, y: 56, vasPain: 0 },
  { id: 'knee_l', name: 'Left Knee Joint & Patella', nameAr: 'مفصل الركبة والصابونة (أيسر)', type: 'joint', x: 42, y: 88, vasPain: 8, condition: 'ACL Grade II Strain + Meniscus' },
  { id: 'knee_r', name: 'Right Knee Joint & Patella', nameAr: 'مفصل الركبة والصابونة (أيمن)', type: 'joint', x: 58, y: 88, vasPain: 0 },

  // Muscles
  { id: 'trapezius', name: 'Trapezius & Neck Musculature', nameAr: 'عضلة الترابيس وعضلات الرقبة', type: 'muscle', x: 50, y: 9, vasPain: 5, condition: 'Upper Trapezius Trigger Points' },
  { id: 'pec_l', name: 'Pectoralis Major (Left)', nameAr: 'عضلة الصدر الكبرى (اليسار)', type: 'muscle', x: 41, y: 22, vasPain: 4, condition: 'Pec Minor Tightness / Forward Shoulder' },
  { id: 'pec_r', name: 'Pectoralis Major (Right)', nameAr: 'عضلة الصدر الكبرى (اليمين)', type: 'muscle', x: 59, y: 22, vasPain: 0 },
  { id: 'deltoid_l', name: 'Deltoid Muscle (Left)', nameAr: 'عضلة الكتف الدالية (اليسار)', type: 'muscle', x: 31, y: 22, vasPain: 6, condition: 'Anterior Deltoid Tendinitis' },
  { id: 'deltoid_r', name: 'Deltoid Muscle (Right)', nameAr: 'عضلة الكتف الدالية (اليمين)', type: 'muscle', x: 69, y: 22, vasPain: 0 },
  { id: 'biceps_l', name: 'Biceps Brachii (Left)', nameAr: 'عضلة البايسبس (اليسار)', type: 'muscle', x: 27, y: 31, vasPain: 3, condition: 'Bicipital Groove Tenderness' },
  { id: 'biceps_r', name: 'Biceps Brachii (Right)', nameAr: 'عضلة البايسبس (اليمين)', type: 'muscle', x: 73, y: 31, vasPain: 0 },
  { id: 'abs', name: 'Rectus Abdominis & Core', nameAr: 'عضلات البطن الستة والكور', type: 'muscle', x: 50, y: 38, vasPain: 2, condition: 'Core Muscular Imbalance' },
  { id: 'quad_l', name: 'Quadriceps Femoris (Left)', nameAr: 'عضلة الفخذ الرباعية (اليسار)', type: 'muscle', x: 42, y: 72, vasPain: 6, condition: 'Rectus Femoris Strain Grade I' },
  { id: 'quad_r', name: 'Quadriceps Femoris (Right)', nameAr: 'عضلة الفخذ الرباعية (اليمين)', type: 'muscle', x: 58, y: 72, vasPain: 0 },
];

function getPainBadge(vas: number) {
  if (vas === 0) return { color: '#047857', label: 'Pain-Free (VAS 0)' };
  if (vas <= 3) return { color: '#FACC15', label: 'Mild (VAS 1-3)' };
  if (vas <= 6) return { color: '#F97316', label: 'Moderate (VAS 4-6)' };
  return { color: '#B91C1C', label: 'Severe (VAS 7-10)' };
}

export function HumanSkeleton3D({ readonly = false }: SpecialtyComponentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('composite');
  const [xRayOpacity, setXRayOpacity] = useState<number>(55); // 0 = Pure Skeleton, 100 = Pure Muscles
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterType, setFilterType] = useState<'all' | 'muscles' | 'joints'>('all');

  const [hotspots, setHotspots] = useState<AnatomicalHotspot[]>(DEFAULT_HOTSPOTS);
  const [hoveredSpot, setHoveredSpot] = useState<AnatomicalHotspot | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<AnatomicalHotspot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Edit states
  const [editVas, setEditVas] = useState<number>(0);
  const [editCondition, setEditCondition] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleSaveSpot = () => {
    if (!selectedSpot) return;
    setHotspots((prev) =>
      prev.map((h) =>
        h.id === selectedSpot.id
          ? { ...h, vasPain: editVas, condition: editCondition, notes: editNotes }
          : h
      )
    );
    setModalOpen(false);
  };

  const visibleHotspots = hotspots.filter((h) => {
    if (filterType === 'muscles') return h.type === 'muscle';
    if (filterType === 'joints') return h.type === 'joint';
    return true;
  });

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #1E293B',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        backgroundColor: '#0A1120',
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <Space>
            <Activity size={17} color="#047857" />
            <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 14 }}>
              Anatomical Musculoskeletal Explorer (عضلات ومفاصل الجسم التشريحي)
            </span>
            <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>
              Ultra-Res Anatomy
            </Tag>
          </Space>

          {/* Mode Selector: Composite / Muscles / Skeleton / Split */}
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            options={[
              { value: 'composite', label: <Space size={4}><Layers size={13} /> كلاهما شفاف (X-Ray Overlay)</Space> },
              { value: 'split', label: <Space size={4}><Eye size={13} /> دمج نصفي (Split Anatomy)</Space> },
              { value: 'muscles', label: <Space size={4}><Sparkles size={13} /> عضلات فقط (Muscles)</Space> },
              { value: 'skeleton', label: <Space size={4}><Activity size={13} /> عظام ومفاصل فقط (Skeleton)</Space> },
            ]}
          />
        </div>
      }
      extra={
        <Space size="small">
          <Button
            size="small"
            icon={<ZoomIn size={13} />}
            onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.0))}
          />
          <Button
            size="small"
            icon={<ZoomOut size={13} />}
            onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.85))}
          />
          <Button
            size="small"
            icon={<RotateCw size={13} />}
            onClick={() => setZoomLevel(1)}
          >
            Reset
          </Button>
        </Space>
      }
      bodyStyle={{ padding: 0, position: 'relative' }}
    >
      {/* Viewport Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 560,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#060B14',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 700,
            height: '100%',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Layer 1: Skeleton Base Layer */}
          {(viewMode === 'skeleton' || viewMode === 'composite') && (
            <img
              src="/anatomy/skeleton_layer.jpg"
              alt="Human Skeletal System"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Layer 2: Muscle Layer with Dynamic X-Ray Opacity Blending */}
          {viewMode === 'composite' && (
            <img
              src="/anatomy/muscles_layer.jpg"
              alt="Human Muscular System Overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: '100%',
                objectFit: 'contain',
                opacity: xRayOpacity / 100,
                pointerEvents: 'none',
                transition: 'opacity 0.1s ease-out',
                mixBlendMode: 'normal',
              }}
            />
          )}

          {/* Layer 3: Pure Muscles Only */}
          {viewMode === 'muscles' && (
            <img
              src="/anatomy/muscles_layer.jpg"
              alt="Human Muscular System"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Layer 4: Split Anatomy (As in the user's reference image) */}
          {viewMode === 'split' && (
            <img
              src="/anatomy/composite_layer.png"
              alt="Split Anatomical Musculoskeletal System"
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Interactive Clinical Hotspot Markers */}
          {visibleHotspots.map((spot) => {
            const isHovered = hoveredSpot?.id === spot.id;
            const badge = getPainBadge(spot.vasPain);
            const isJoint = spot.type === 'joint';

            return (
              <div
                key={spot.id}
                onClick={() => {
                  if (readonly) return;
                  setSelectedSpot(spot);
                  setEditVas(spot.vasPain);
                  setEditCondition(spot.condition || '');
                  setEditNotes(spot.notes || '');
                  setModalOpen(true);
                }}
                onMouseEnter={() => setHoveredSpot(spot)}
                onMouseLeave={() => setHoveredSpot(null)}
                style={{
                  position: 'absolute',
                  top: `${spot.y}%`,
                  left: `${spot.x}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: readonly ? 'default' : 'pointer',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Outer Glow Halo */}
                <div
                  style={{
                    position: 'absolute',
                    width: isHovered ? 36 : 24,
                    height: isHovered ? 36 : 24,
                    borderRadius: isJoint ? '50%' : '6px',
                    backgroundColor: `${badge.color}35`,
                    border: `1.5px solid ${badge.color}`,
                    transition: 'all 0.15s ease',
                    boxShadow: `0 0 14px ${badge.color}`,
                    animation: spot.vasPain > 5 ? 'pulse 1.4s infinite' : 'none',
                  }}
                />

                {/* Inner Core Dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: isJoint ? '50%' : '2px',
                    backgroundColor: spot.vasPain > 0 ? badge.color : '#FFFFFF',
                    border: '1.5px solid #0F172A',
                    zIndex: 2,
                  }}
                />

                {/* Inline Label Tag if High Pain */}
                {spot.vasPain >= 6 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -18,
                      backgroundColor: badge.color,
                      color: '#FFFFFF',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    }}
                  >
                    VAS {spot.vasPain}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Telemetry Card on Hover */}
        {hoveredSpot && (
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 18,
              backgroundColor: 'rgba(10, 17, 34, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #1E293B',
              borderRadius: 10,
              padding: '12px 18px',
              color: '#FFFFFF',
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 30,
              minWidth: 260,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#F8FAFC' }}>
                {hoveredSpot.name}
              </span>
              <Tag color={hoveredSpot.vasPain > 6 ? 'red' : hoveredSpot.vasPain > 3 ? 'orange' : 'green'}>
                VAS {hoveredSpot.vasPain}/10
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: '#38BDF8', fontWeight: 600, marginBottom: 2 }}>
              {hoveredSpot.nameAr}
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              التصنيف: <strong style={{ color: hoveredSpot.type === 'muscle' ? '#BE123C' : '#38BDF8' }}>
                {hoveredSpot.type === 'muscle' ? 'عضلة وأوتار (Muscular)' : 'مفصل عظمي (Articular Joint)'}
              </strong>
            </div>
            {hoveredSpot.condition && (
              <div style={{ fontSize: 11, color: '#FDE047', marginTop: 6, borderTop: '1px solid #1E293B', paddingTop: 6 }}>
                الحالة المرضية: {hoveredSpot.condition}
              </div>
            )}
          </div>
        )}

        {/* Bottom Interactive Controls (X-Ray Opacity Slider & Quick Filter) */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 18,
            right: 18,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            backgroundColor: 'rgba(10, 17, 34, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #1E293B',
            borderRadius: 8,
            padding: '8px 16px',
            zIndex: 25,
          }}
        >
          {/* Target Filter (Muscles vs Joints vs All) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#64748B', fontSize: 11 }}>إظهار النقاط:</span>
            <Segmented
              size="small"
              value={filterType}
              onChange={(v) => setFilterType(v as any)}
              options={[
                { value: 'all', label: 'الكل (مفاصل وعضلات)' },
                { value: 'muscles', label: 'عضلات فقط' },
                { value: 'joints', label: 'مفاصل فقط' },
              ]}
            />
          </div>

          {/* X-Ray Muscle/Skeleton Crossfader (Only when in composite mode) */}
          {viewMode === 'composite' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#E2E8F0', fontSize: 11, fontWeight: 600 }}>
                🦴 عظام 0%
              </span>
              <Slider
                min={0}
                max={100}
                value={xRayOpacity}
                onChange={setXRayOpacity}
                style={{ width: 140, margin: '0 6px' }}
                tooltip={{ formatter: (v) => `شفافية العضلات: ${v}%` }}
              />
              <span style={{ color: '#BE123C', fontSize: 11, fontWeight: 600 }}>
                عضلات 100% 💪
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legend Bar */}
      <div
        style={{
          padding: '10px 18px',
          backgroundColor: '#0F172A',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space size="middle" wrap>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#047857', boxShadow: '0 0 6px #047857' }} />
            طبيعي بدون ألم (VAS 0)
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FACC15', boxShadow: '0 0 6px #FACC15' }} />
            ألم خفيف (VAS 1–3)
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F97316', boxShadow: '0 0 6px #F97316' }} />
            ألم متوسط / شد عضلي (VAS 4–6)
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#B91C1C', boxShadow: '0 0 6px #B91C1C' }} />
            ألم حاد / تمزق أو غضروف (VAS 7–10)
          </span>
        </Space>

        <Text style={{ color: '#64748B', fontSize: 11 }}>
          اضغط على أي عضلة أو مفصل لتسجيل التشخيص ونقاط الزناد العضلية
        </Text>
      </div>

      {/* Clinical Assessment & Trigger Point Modal */}
      <Modal
        title={`فحص العضو التشريحي: ${selectedSpot?.name} (${selectedSpot?.nameAr})`}
        open={modalOpen}
        onOk={handleSaveSpot}
        onCancel={() => setModalOpen(false)}
        okText="حفظ التشخيص في الزيارة"
        cancelText="إلغاء"
        width={540}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
          {/* Pain Scale Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text strong style={{ fontSize: 13 }}>شدة الألم (Visual Analogue Scale 0–10)</Text>
              <Tag color={editVas > 6 ? 'red' : editVas > 3 ? 'orange' : 'green'} style={{ fontWeight: 700 }}>
                {editVas} / 10
              </Tag>
            </div>
            <Slider min={0} max={10} value={editVas} onChange={setEditVas} />
          </div>

          {/* Condition / Pathology */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
              التشخيص الإكلينيكي / الإصابة
            </Text>
            <Input
              value={editCondition}
              onChange={(e) => setEditCondition(e.target.value)}
              placeholder="مثال: تمزق عضلي Grade I، نقاط زناد عضلية، انزلاق غضروفي، التهاب أوتار..."
            />
          </div>

          {/* Treatment Notes */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
              الخطة العلاجية والفيزيائية المقررة
            </Text>
            <Input.TextArea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="مثال: إبر جافة (Dry Needling)، موجات تصادمية، إطالات، تقوية وتدليك عميق..."
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
