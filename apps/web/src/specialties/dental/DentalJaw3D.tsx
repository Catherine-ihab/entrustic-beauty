import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card, Tag, Space, Typography, Button, Modal, Radio, Input, Slider, Segmented, Checkbox } from 'antd';
import { RotateCw, Sparkles } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

export type ToothStatus = 'healthy' | 'decay' | 'filled' | 'missing' | 'crown' | 'implant';

export interface Tooth3DState {
  fdiNumber: number;
  name?: string;
  arch?: 'maxilla' | 'mandible';
  status: ToothStatus;
  surfaces?: string[];
  notes?: string;
}

const TOOTH_NAMES: Record<number, string> = {
  18: 'Upper Right 3rd Molar (Wisdom)',
  17: 'Upper Right 2nd Molar',
  16: 'Upper Right 1st Molar',
  15: 'Upper Right 2nd Premolar',
  14: 'Upper Right 1st Premolar',
  13: 'Upper Right Canine',
  12: 'Upper Right Lateral Incisor',
  11: 'Upper Right Central Incisor',
  21: 'Upper Left Central Incisor',
  22: 'Upper Left Lateral Incisor',
  23: 'Upper Left Canine',
  24: 'Upper Left 1st Premolar',
  25: 'Upper Left 2nd Premolar',
  26: 'Upper Left 1st Molar',
  27: 'Upper Left 2nd Molar',
  28: 'Upper Left 3rd Molar (Wisdom)',

  48: 'Lower Right 3rd Molar (Wisdom)',
  47: 'Lower Right 2nd Molar',
  46: 'Lower Right 1st Molar',
  45: 'Lower Right 2nd Premolar',
  44: 'Lower Right 1st Premolar',
  43: 'Lower Right Canine',
  42: 'Lower Right Lateral Incisor',
  41: 'Lower Right Central Incisor',
  31: 'Lower Left Central Incisor',
  32: 'Lower Left Lateral Incisor',
  33: 'Lower Left Canine',
  34: 'Lower Left 1st Premolar',
  35: 'Lower Left 2nd Premolar',
  36: 'Lower Left 1st Molar',
  37: 'Lower Left 2nd Molar',
  38: 'Lower Left 3rd Molar (Wisdom)',
};

const UPPER_TEETH_FDI = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH_FDI = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// High-end medical color palette
const STATUS_COLORS: Record<ToothStatus, { main: number; emissive: number }> = {
  healthy: { main: 0xfbf9f5, emissive: 0x000000 }, // Pristine ivory enamel
  decay: { main: 0xef4444, emissive: 0x7f1d1d }, // Clinical alert red
  filled: { main: 0x3b82f6, emissive: 0x1e3a8a }, // Composite / amalgam blue
  crown: { main: 0xf59e0b, emissive: 0x78350f }, // Aesthetic ceramic/gold crown
  implant: { main: 0x10b981, emissive: 0x064e3b }, // Titanium implant green
  missing: { main: 0x334155, emissive: 0x000000 }, // Extracted gap
};

export function DentalJaw3D({ readonly = false, onStateChange }: SpecialtyComponentProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [archFilter, setArchFilter] = useState<'both' | 'upper' | 'lower'>('both');
  const [jawOpenAngle, setJawOpenAngle] = useState<number>(22); // degrees
  const [hoveredTooth, setHoveredTooth] = useState<Tooth3DState | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<Tooth3DState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Edit finding states
  const [editStatus, setEditStatus] = useState<ToothStatus>('healthy');
  const [editSurfaces, setEditSurfaces] = useState<string[]>(['O']);
  const [editNotes, setEditNotes] = useState<string>('');

  const [teethStates, setTeethStates] = useState<Record<number, Tooth3DState>>({
    16: { fdiNumber: 16, name: TOOTH_NAMES[16], arch: 'maxilla', status: 'decay', notes: 'Mesio-occlusal caries' },
    24: { fdiNumber: 24, name: TOOTH_NAMES[24], arch: 'maxilla', status: 'filled', notes: 'Composite restoration' },
    36: { fdiNumber: 36, name: TOOTH_NAMES[36], arch: 'mandible', status: 'crown', notes: 'Zirconia aesthetic crown' },
    46: { fdiNumber: 46, name: TOOTH_NAMES[46], arch: 'mandible', status: 'implant', notes: 'Titanium implant fixture' },
  });

  const upperGroupRef = useRef<THREE.Group | null>(null);
  const lowerGroupRef = useRef<THREE.Group | null>(null);
  const wholeJawRef = useRef<THREE.Group | null>(null);
  const teethMeshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const highlightMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = 480;

    // 1. Scene setup with refined clinical lighting
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120); // Surgical dark slate background

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 4, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Clinical Dental Lighting (Operatory Lamp Rig)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    // Main Dental Spotlight (Simulating overhead operatory light)
    const dentalLamp = new THREE.SpotLight(0xffffff, 3.5, 30, Math.PI / 4, 0.3, 1);
    dentalLamp.position.set(0, 10, 12);
    dentalLamp.castShadow = true;
    scene.add(dentalLamp);

    // Fill Light (Soft daylight)
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.0);
    fillLight.position.set(-8, 5, 8);
    scene.add(fillLight);

    // Rim / Backlight for specular tooth edge definition
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(8, -4, -10);
    scene.add(rimLight);

    // 5. Build Whole Jaw Group
    const wholeJaw = new THREE.Group();
    scene.add(wholeJaw);
    wholeJawRef.current = wholeJaw;

    // Helper: Build Anatomically-Shaped Tooth Mesh
    const createAnatomicalTooth = (fdi: number): THREE.BufferGeometry => {
      const isMolar = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(fdi);
      const isPremolar = [15, 14, 24, 25, 45, 44, 34, 35].includes(fdi);
      const isCanine = [13, 23, 33, 43].includes(fdi);

      if (isMolar) {
        // Multi-cusp rounded molar crown
        const geom = new THREE.CylinderGeometry(0.55, 0.45, 0.85, 16);
        geom.scale(1.2, 1, 1.05);
        return geom;
      } else if (isPremolar) {
        // Bicuspid rounded premolar crown
        const geom = new THREE.CylinderGeometry(0.42, 0.35, 0.8, 14);
        geom.scale(1.0, 1, 0.9);
        return geom;
      } else if (isCanine) {
        // Pointed canine crown
        const geom = new THREE.ConeGeometry(0.38, 0.95, 14);
        geom.rotateX(Math.PI);
        return geom;
      } else {
        // Incisor chisel blade
        const geom = new THREE.BoxGeometry(0.48, 0.85, 0.28);
        return geom;
      }
    };

    // Helper: Realistic Pink Gingival Tissue (Gum) Curve
    const createGingivaArch = (teethFdi: number[], yPos: number, isUpper: boolean) => {
      const points: THREE.Vector3[] = [];
      const count = teethFdi.length;
      const radiusX = isUpper ? 4.3 : 3.9;
      const radiusZ = isUpper ? 4.6 : 4.2;

      for (let i = 0; i <= count; i++) {
        const t = (i / count) * Math.PI - Math.PI / 2;
        const x = Math.sin(t) * radiusX;
        const z = -Math.cos(t) * radiusZ + radiusZ / 2;
        points.push(new THREE.Vector3(x, yPos + (isUpper ? 0.35 : -0.35), z));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeom = new THREE.TubeGeometry(curve, 48, isUpper ? 0.45 : 0.42, 16, false);
      const gumMat = new THREE.MeshPhysicalMaterial({
        color: 0xdd7a85, // Natural gingival pink
        roughness: 0.35,
        clearcoat: 0.6,
        clearcoatRoughness: 0.2,
      });

      return new THREE.Mesh(tubeGeom, gumMat);
    };

    // Upper Arch (Maxilla)
    const upperGroup = new THREE.Group();
    wholeJaw.add(upperGroup);
    upperGroupRef.current = upperGroup;

    // Add Upper Gingiva
    const upperGum = createGingivaArch(UPPER_TEETH_FDI, 1.0, true);
    upperGroup.add(upperGum);

    // Lower Arch (Mandible)
    const lowerGroup = new THREE.Group();
    wholeJaw.add(lowerGroup);
    lowerGroupRef.current = lowerGroup;

    // Add Lower Gingiva
    const lowerGum = createGingivaArch(LOWER_TEETH_FDI, -1.0, false);
    lowerGroup.add(lowerGum);

    // Build Individual Teeth into arches
    const populateArch = (teethFdi: number[], parentGroup: THREE.Group, isUpper: boolean) => {
      const count = teethFdi.length;
      const radiusX = isUpper ? 4.3 : 3.9;
      const radiusZ = isUpper ? 4.6 : 4.2;
      const yOffset = isUpper ? 1.0 : -1.0;

      teethFdi.forEach((fdi, idx) => {
        const t = (idx / (count - 1)) * Math.PI - Math.PI / 2;
        const x = Math.sin(t) * radiusX;
        const z = -Math.cos(t) * radiusZ + radiusZ / 2;

        const geom = createAnatomicalTooth(fdi);
        const currStatus = teethStates[fdi]?.status || 'healthy';
        const colorCfg = STATUS_COLORS[currStatus];

        const mat = new THREE.MeshPhysicalMaterial({
          color: colorCfg.main,
          emissive: colorCfg.emissive,
          roughness: currStatus === 'implant' ? 0.3 : 0.18,
          metalness: currStatus === 'implant' ? 0.85 : currStatus === 'crown' ? 0.3 : 0.05,
          clearcoat: currStatus === 'implant' ? 0.1 : 0.95,
          clearcoatRoughness: 0.1,
          reflectivity: 0.9,
        });

        const toothMesh = new THREE.Mesh(geom, mat);
        toothMesh.position.set(x, yOffset, z);
        toothMesh.rotation.y = -t;
        toothMesh.castShadow = true;
        toothMesh.receiveShadow = true;
        toothMesh.userData = { fdi, arch: isUpper ? 'maxilla' : 'mandible' };

        parentGroup.add(toothMesh);
        teethMeshesRef.current.set(fdi, toothMesh);
      });
    };

    populateArch(UPPER_TEETH_FDI, upperGroup, true);
    populateArch(LOWER_TEETH_FDI, lowerGroup, false);

    // Initial mouth open position
    const rad = THREE.MathUtils.degToRad(jawOpenAngle);
    lowerGroup.rotation.x = rad;
    lowerGroup.position.y = -Math.sin(rad) * 1.5;

    // Hover Selection Indicator Ring
    const ringGeom = new THREE.RingGeometry(0.55, 0.7, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const highlightMesh = new THREE.Mesh(ringGeom, ringMat);
    highlightMesh.rotation.x = Math.PI / 2;
    highlightMesh.visible = false;
    scene.add(highlightMesh);
    highlightMeshRef.current = highlightMesh;

    // 6. Smooth Mouse Orbit Drag
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        wholeJaw.rotation.y += dx * 0.008;
        wholeJaw.rotation.x = Math.max(-0.7, Math.min(0.7, wholeJaw.rotation.x + dy * 0.008));
        prevX = e.clientX;
        prevY = e.clientY;
      }

      // Raycasting on hover
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const allTeeth = Array.from(teethMeshesRef.current.values());
      const hits = raycaster.intersectObjects(allTeeth);

      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh;
        const fdi = hit.userData.fdi as number;
        if (fdi) {
          const toothInfo = teethStates[fdi] || {
            fdiNumber: fdi,
            name: TOOTH_NAMES[fdi] || `Tooth #${fdi}`,
            arch: hit.userData.arch,
            status: 'healthy',
          };
          setHoveredTooth(toothInfo);

          // Position highlight ring around tooth
          if (highlightMeshRef.current) {
            const worldPos = new THREE.Vector3();
            hit.getWorldPosition(worldPos);
            highlightMeshRef.current.position.copy(worldPos);
            highlightMeshRef.current.position.y += hit.userData.arch === 'maxilla' ? -0.4 : 0.4;
            highlightMeshRef.current.visible = true;
          }
        }
      } else {
        setHoveredTooth(null);
        if (highlightMeshRef.current) highlightMeshRef.current.visible = false;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const allTeeth = Array.from(teethMeshesRef.current.values());
      const hits = raycaster.intersectObjects(allTeeth);

      if (hits.length > 0) {
        const hit = hits[0].object as THREE.Mesh;
        const fdi = hit.userData.fdi as number;
        if (fdi) {
          const toothInfo = teethStates[fdi] || {
            fdiNumber: fdi,
            name: TOOTH_NAMES[fdi] || `Tooth #${fdi}`,
            arch: hit.userData.arch,
            status: 'healthy',
          };
          setSelectedTooth(toothInfo);
          setEditStatus(toothInfo.status);
          setEditSurfaces(toothInfo.surfaces || ['O']);
          setEditNotes(toothInfo.notes || '');
          if (!readonly) setModalOpen(true);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', onClick);

    // 7. Render Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update Jaw Opening Angle when slider changes
  useEffect(() => {
    if (lowerGroupRef.current) {
      const rad = THREE.MathUtils.degToRad(jawOpenAngle);
      lowerGroupRef.current.rotation.x = rad;
      lowerGroupRef.current.position.y = -Math.sin(rad) * 1.5;
    }
  }, [jawOpenAngle]);

  // Update Arch Visibility Filter
  useEffect(() => {
    if (upperGroupRef.current) {
      upperGroupRef.current.visible = archFilter === 'both' || archFilter === 'upper';
    }
    if (lowerGroupRef.current) {
      lowerGroupRef.current.visible = archFilter === 'both' || archFilter === 'lower';
    }
  }, [archFilter]);

  // Update Materials when tooth states change
  useEffect(() => {
    teethMeshesRef.current.forEach((mesh, fdi) => {
      const st = teethStates[fdi]?.status || 'healthy';
      const cfg = STATUS_COLORS[st];
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      mat.color.setHex(cfg.main);
      mat.emissive.setHex(cfg.emissive);
      mat.metalness = st === 'implant' ? 0.85 : st === 'crown' ? 0.3 : 0.05;
      mat.roughness = st === 'implant' ? 0.3 : 0.18;
    });
  }, [teethStates]);

  // Camera Presets
  const setCameraPreset = (preset: 'smile' | 'upper_occlusal' | 'lower_occlusal' | 'right' | 'left') => {
    if (!cameraRef.current || !wholeJawRef.current) return;
    wholeJawRef.current.rotation.set(0, 0, 0);

    switch (preset) {
      case 'smile':
        cameraRef.current.position.set(0, 0.5, 14);
        cameraRef.current.lookAt(0, 0, 0);
        break;
      case 'upper_occlusal':
        cameraRef.current.position.set(0, -10, 8);
        cameraRef.current.lookAt(0, 1.2, 0);
        break;
      case 'lower_occlusal':
        cameraRef.current.position.set(0, 10, 8);
        cameraRef.current.lookAt(0, -1.2, 0);
        break;
      case 'right':
        cameraRef.current.position.set(13, 1, 6);
        cameraRef.current.lookAt(0, 0, 0);
        break;
      case 'left':
        cameraRef.current.position.set(-13, 1, 6);
        cameraRef.current.lookAt(0, 0, 0);
        break;
    }
  };

  const handleSaveTooth = () => {
    if (!selectedTooth) return;
    const updated = {
      ...teethStates,
      [selectedTooth.fdiNumber]: {
        ...selectedTooth,
        status: editStatus,
        surfaces: editSurfaces,
        notes: editNotes,
      },
    };
    setTeethStates(updated);
    if (onStateChange) onStateChange(updated);
    setModalOpen(false);
  };

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #1E293B',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <Space>
            <Sparkles size={16} color="#38BDF8" />
            <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>
              3D Interactive Maxillofacial &amp; Dental Arch
            </span>
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
              Physiological Shading
            </Tag>
          </Space>

          <Segmented
            size="small"
            value={archFilter}
            onChange={(val) => setArchFilter(val as any)}
            options={[
              { value: 'both', label: 'Complete Dentition (Both)' },
              { value: 'upper', label: 'Maxilla (Upper)' },
              { value: 'lower', label: 'Mandible (Lower)' },
            ]}
          />
        </div>
      }
      extra={
        <Space size="small">
          <Button
            size="small"
            icon={<RotateCw size={12} />}
            onClick={() => setCameraPreset('smile')}
          >
            Reset
          </Button>
        </Space>
      }
      bodyStyle={{ padding: 0, position: 'relative', backgroundColor: '#0B1120' }}
    >
      {/* 3D Canvas Mount */}
      <div ref={mountRef} style={{ width: '100%', height: 480, cursor: 'grab' }} />

      {/* Floating Hover Tooth Inspector */}
      {hoveredTooth && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 16,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: '8px 14px',
            color: '#FFFFFF',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: `#${STATUS_COLORS[hoveredTooth.status].main.toString(16).padStart(6, '0')}`,
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Tooth #{hoveredTooth.fdiNumber} · {hoveredTooth.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', textTransform: 'capitalize' }}>
              Condition: {hoveredTooth.status} {hoveredTooth.notes ? `(${hoveredTooth.notes})` : ''}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Clinical Controls & Camera Presets */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 16,
          right: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: '6px 14px',
        }}
      >
        {/* Camera Views */}
        <Space size="small" wrap>
          <span style={{ color: '#64748B', fontSize: 11 }}>View Angle:</span>
          <Button size="small" onClick={() => setCameraPreset('smile')}>Anterior Smile</Button>
          <Button size="small" onClick={() => setCameraPreset('upper_occlusal')}>Upper Biting</Button>
          <Button size="small" onClick={() => setCameraPreset('lower_occlusal')}>Lower Biting</Button>
          <Button size="small" onClick={() => setCameraPreset('right')}>Right Lateral</Button>
          <Button size="small" onClick={() => setCameraPreset('left')}>Left Lateral</Button>
        </Space>

        {/* Jaw Opening Articulator Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
          <span style={{ color: '#64748B', fontSize: 11, whiteSpace: 'nowrap' }}>Jaw Opening:</span>
          <Slider
            min={0}
            max={45}
            value={jawOpenAngle}
            onChange={setJawOpenAngle}
            style={{ width: 100, margin: '0 4px' }}
          />
          <span style={{ color: '#E2E8F0', fontSize: 11 }}>{jawOpenAngle}°</span>
        </div>
      </div>

      {/* Clinical Legend */}
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
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FBF9F5', boxShadow: '0 0 6px rgba(255,255,255,0.8)' }} />
            Sound Enamel
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#B91C1C' }} />
            Active Caries / Decay
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1D4ED8' }} />
            Restored / Filled
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            Prosthetic Crown
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#047857' }} />
            Titanium Implant
          </span>
          <span style={{ color: '#E2E8F0', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#334155' }} />
            Extracted / Missing
          </span>
        </Space>

        <Text style={{ color: '#64748B', fontSize: 11 }}>
          Click any tooth in 3D to edit clinical pathology &amp; restorations
        </Text>
      </div>

      {/* Edit Tooth Pathology Modal */}
      <Modal
        title={`Tooth FDI #${selectedTooth?.fdiNumber} — ${selectedTooth?.name}`}
        open={modalOpen}
        onOk={handleSaveTooth}
        onCancel={() => setModalOpen(false)}
        okText="Save Dental Record"
        cancelText="Cancel"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
              Tooth Pathology / Clinical Condition
            </Text>
            <Radio.Group
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="healthy">Sound / Intact Natural Enamel</Radio>
                <Radio value="decay">Active Dental Caries (Cavitary Decay)</Radio>
                <Radio value="filled">Composite / Amalgam Direct Restoration</Radio>
                <Radio value="crown">Full Coverage Crown (Zirconia / E-max / PFM)</Radio>
                <Radio value="implant">Osseointegrated Implant with Abutment</Radio>
                <Radio value="missing">Extracted / Congenitally Absent</Radio>
              </Space>
            </Radio.Group>
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
              Involved Tooth Surfaces
            </Text>
            <Checkbox.Group
              value={editSurfaces}
              onChange={(v) => setEditSurfaces(v as string[])}
              options={[
                { value: 'M', label: 'Mesial (M)' },
                { value: 'O', label: 'Occlusal (O)' },
                { value: 'D', label: 'Distal (D)' },
                { value: 'B', label: 'Buccal (B)' },
                { value: 'L', label: 'Lingual (L)' },
              ]}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
              Clinical Findings, Shade &amp; Treatment Plan
            </Text>
            <Input.TextArea
              rows={3}
              placeholder="e.g. MO decay with pulp proximity, Shade A2 composite, vitality cold test positive..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
