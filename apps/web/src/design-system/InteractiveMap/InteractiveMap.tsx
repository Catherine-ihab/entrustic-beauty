import { useState } from 'react';
import { Tooltip, Tag } from 'antd';
import { MapDefinition, MapRegion, RegionState, StatusConfig } from './types';

interface InteractiveMapProps {
  definition: MapDefinition;
  regionStates?: Record<string, RegionState>;
  selectedRegionId?: string | null;
  onRegionClick?: (region: MapRegion, currentState?: RegionState) => void;
  statusConfig?: Record<string, StatusConfig>;
  width?: number | string;
  height?: number | string;
  readonly?: boolean;
}

const DEFAULT_STATUS_CONFIG: Record<string, StatusConfig> = {
  normal:      { label: 'Normal / Intact',   color: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
  treated:     { label: 'Treated / Injected', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  attention:   { label: 'Pathology / Focus', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  planned:     { label: 'Treatment Planned',  color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  monitoring:  { label: 'Observation',       color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
};

export function InteractiveMap({
  definition,
  regionStates = {},
  selectedRegionId,
  onRegionClick,
  statusConfig = DEFAULT_STATUS_CONFIG,
  width = '100%',
  height = 420,
  readonly = false,
}: InteractiveMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<MapRegion | null>(null);

  const getRegionStyle = (region: MapRegion) => {
    const state = regionStates[region.id];
    const isSelected = selectedRegionId === region.id;
    const isHovered = hoveredRegion?.id === region.id;

    if (state && statusConfig[state.status]) {
      const cfg = statusConfig[state.status];
      return {
        fill: isHovered ? cfg.border : cfg.bg,
        stroke: isSelected ? '#0F172A' : cfg.color,
        strokeWidth: isSelected ? 2.5 : isHovered ? 2 : 1.2,
      };
    }

    // Default neutral state
    return {
      fill: isHovered ? '#E2E8F0' : '#F1F5F9',
      stroke: isSelected ? '#2563EB' : isHovered ? '#64748B' : '#CBD5E1',
      strokeWidth: isSelected ? 2.5 : isHovered ? 1.8 : 1,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 14,
          padding: '8px 14px',
          backgroundColor: '#F8FAFC',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          width: '100%',
        }}
      >
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: cfg.bg,
                border: `1.5px solid ${cfg.color}`,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* SVG Canvas */}
      <div
        style={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          padding: 12,
          position: 'relative',
        }}
      >
        <svg
          viewBox={definition.viewBox}
          style={{ width: '100%', height: '100%', maxHeight: '100%' }}
        >
          {definition.regions.map((region) => {
            const state = regionStates[region.id];
            const style = getRegionStyle(region);
            const tooltipContent = (
              <div>
                <strong>{region.label}</strong>
                {region.group && <div style={{ fontSize: 11, color: '#64748B' }}>{region.group}</div>}
                {state && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue" style={{ fontSize: 10 }}>
                      {statusConfig[state.status]?.label || state.status}
                    </Tag>
                    {state.notes && <div style={{ fontSize: 11, marginTop: 2 }}>{state.notes}</div>}
                  </div>
                )}
              </div>
            );

            const interactiveProps = {
              onClick: () => !readonly && onRegionClick?.(region, state),
              onMouseEnter: () => setHoveredRegion(region),
              onMouseLeave: () => setHoveredRegion(null),
              style: {
                cursor: readonly ? 'default' : 'pointer',
                transition: 'all 0.15s ease',
              },
            };

            if (region.rect) {
              return (
                <Tooltip key={region.id} title={tooltipContent}>
                  <g {...interactiveProps}>
                    <rect
                      x={region.rect.x}
                      y={region.rect.y}
                      width={region.rect.width}
                      height={region.rect.height}
                      rx={region.rect.rx || 4}
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                    />
                    <text
                      x={region.rect.x + region.rect.width / 2}
                      y={region.rect.y + region.rect.height / 2 + 3}
                      textAnchor="middle"
                      fontSize={8}
                      fontWeight={600}
                      fill={state ? '#0F172A' : '#64748B'}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {region.id.slice(0, 4).toUpperCase()}
                    </text>
                  </g>
                </Tooltip>
              );
            }

            if (region.cx !== undefined && region.cy !== undefined) {
              return (
                <Tooltip key={region.id} title={tooltipContent}>
                  <circle
                    key={region.id}
                    cx={region.cx}
                    cy={region.cy}
                    r={region.r || 12}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    {...interactiveProps}
                  />
                </Tooltip>
              );
            }

            if (region.path) {
              return (
                <Tooltip key={region.id} title={tooltipContent}>
                  <path
                    d={region.path}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    {...interactiveProps}
                  />
                </Tooltip>
              );
            }

            return null;
          })}
        </svg>
      </div>
    </div>
  );
}
