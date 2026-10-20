export interface MapRegion {
  id: string;
  label: string;
  path?: string;
  cx?: number;
  cy?: number;
  r?: number;
  rect?: { x: number; y: number; width: number; height: number; rx?: number };
  group?: string;
}

export interface RegionState {
  status: string;
  color?: string;
  label?: string;
  notes?: string;
  details?: Record<string, any>;
}

export interface MapDefinition {
  id: string;
  title: string;
  viewBox: string;
  regions: MapRegion[];
}

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
}
