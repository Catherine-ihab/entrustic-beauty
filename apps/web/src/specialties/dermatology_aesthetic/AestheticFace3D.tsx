import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card, Tag, Space, Typography, Button, Modal, InputNumber, Select } from 'antd';
import { RotateCw, Sparkles, Syringe } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

export interface InjectionSite {
  zoneId: string;
  name: string;
  pos: [number, number, number];
  unitsBotox: number;
  fillerMl: number;
  product?: string;
}

const DEFAULT_INJECTION_ZONES: InjectionSite[] = [
  { zoneId: 'glabella_procerus', name: 'Glabella / Procerus', pos: [0, 1.2, 2.9], unitsBotox: 8, fillerMl: 0 },
  { zoneId: 'corrugator_left', name: 'Corrugator (Left)', pos: [-0.8, 1.35, 2.8], unitsBotox: 4, fillerMl: 0 },
  { zoneId: 'corrugator_right', name: 'Corrugator (Right)', pos: [0.8, 1.35, 2.8], unitsBotox: 4, fillerMl: 0 },
  { zoneId: 'frontalis_mid', name: 'Frontalis Mid-Forehead', pos: [0, 2.3, 2.6], unitsBotox: 10, fillerMl: 0 },
  { zoneId: 'crows_feet_left', name: "Crow's Feet (Left)", pos: [-2.1, 0.9, 2.1], unitsBotox: 6, fillerMl: 0 },
  { zoneId: 'crows_feet_right', name: "Crow's Feet (Right)", pos: [2.1, 0.9, 2.1], unitsBotox: 6, fillerMl: 0 },
  { zoneId: 'nasolabial_left', name: 'Nasolabial Fold (Left)', pos: [-0.9, -0.6, 2.6], unitsBotox: 0, fillerMl: 0.5, product: 'Juvederm Voluma' },
  { zoneId: 'nasolabial_right', name: 'Nasolabial Fold (Right)', pos: [0.9, -0.6, 2.6], unitsBotox: 0, fillerMl: 0.5, product: 'Juvederm Voluma' },
  { zoneId: 'lip_upper', name: 'Upper Vermilion Border', pos: [0, -1.3, 2.7], unitsBotox: 0, fillerMl: 0.6, product: 'Restylane Kysse' },
  { zoneId: 'lip_lower', name: 'Lower Lip Body', pos: [0, -1.8, 2.6], unitsBotox: 0, fillerMl: 0.4, product: 'Restylane Kysse' },
  { zoneId: 'jawline_angle_left', name: 'Mandibular Angle (Left)', pos: [-2.4, -2.2, 1.2], unitsBotox: 20, fillerMl: 0 },
  { zoneId: 'jawline_angle_right', name: 'Mandibular Angle (Right)', pos: [2.4, -2.2, 1.2], unitsBotox: 20, fillerMl: 0 },
];

export function AestheticFace3D({ readonly = false }: SpecialtyComponentProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<InjectionSite[]>(DEFAULT_INJECTION_ZONES);
  const [selectedZone, setSelectedZone] = useState<InjectionSite | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Modal edit states
  const [editBotox, setEditBotox] = useState<number>(0);
  const [editFiller, setEditFiller] = useState<number>(0);
  const [editProduct, setEditProduct] = useState<string>('Botox Cosmetic (Allergan)');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 550;
    const height = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 10);
    scene.add(dir);
    const rim = new THREE.DirectionalLight(0xec4899, 0.5); // Subtle pink rim light
    rim.position.set(-5, -5, -5);
    scene.add(rim);

    // Anatomical 3D Head Group
    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // Head base ellipsoid
    const headGeom = new THREE.SphereGeometry(2.8, 32, 32);
    headGeom.scale(0.85, 1.15, 1.0);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate neutral head mannequin
      roughness: 0.6,
      metalness: 0.1,
      wireframe: false,
    });
    const headMesh = new THREE.Mesh(headGeom, headMat);
    headGroup.add(headMesh);

    // Pin markers group
    const pinsGroup = new THREE.Group();
    headGroup.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    const pinGeometry = new THREE.SphereGeometry(0.2, 16, 16);

    zones.forEach((z) => {
      const hasTreatment = z.unitsBotox > 0 || z.fillerMl > 0;
      const color = z.fillerMl > 0 ? 0xec4899 : z.unitsBotox > 0 ? 0x3b82f6 : 0x64748b;
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.5,
        emissive: hasTreatment ? (z.fillerMl > 0 ? 0x831843 : 0x1e3a8a) : 0x000000,
      });

      const pin = new THREE.Mesh(pinGeometry, mat);
      pin.position.set(z.pos[0], z.pos[1], z.pos[2]);
      pin.userData = { zoneId: z.zoneId };
      pinsGroup.add(pin);
    });

    // Orbit Drag Rotation
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      headGroup.rotation.y += dx * 0.01;
      headGroup.rotation.x = Math.max(-0.5, Math.min(0.5, headGroup.rotation.x + dy * 0.01));
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Raycast Pin Clicks
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pinsGroup.children);
      if (hits.length > 0) {
        const zoneId = hits[0].object.userData.zoneId;
        const target = zones.find((z) => z.zoneId === zoneId);
        if (target) {
          setSelectedZone(target);
          setEditBotox(target.unitsBotox);
          setEditFiller(target.fillerMl);
          setEditProduct(target.product || 'Botox Cosmetic');
          if (!readonly) setModalOpen(true);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('click', onClick);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, []);

  const totalBotox = zones.reduce((acc, z) => acc + z.unitsBotox, 0);
  const totalFiller = +zones.reduce((acc, z) => acc + z.fillerMl, 0).toFixed(1);

  const handleSaveZone = () => {
    if (!selectedZone) return;
    setZones((prev) =>
      prev.map((z) =>
        z.zoneId === selectedZone.zoneId
          ? { ...z, unitsBotox: editBotox, fillerMl: editFiller, product: editProduct }
          : z
      )
    );
    setModalOpen(false);
  };

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span style={{ fontWeight: 600 }}>3D Facial Anatomy &amp; Injectables Mapping</span>
            <Tag color="magenta">Aesthetic 3D</Tag>
          </Space>
          <Space>
            <Tag color="blue" icon={<Syringe size={12} />}>Botox: {totalBotox} Units</Tag>
            <Tag color="pink" icon={<Sparkles size={12} />}>Filler: {totalFiller} mL</Tag>
          </Space>
        </div>
      }
      extra={
        <Button
          size="small"
          icon={<RotateCw size={12} />}
          onClick={() => {
            if (cameraRef.current) cameraRef.current.position.set(0, 0, 9);
          }}
        >
          Reset View
        </Button>
      }
      bodyStyle={{ padding: 0 }}
    >
      <div ref={mountRef} style={{ width: '100%', height: 400, cursor: 'grab' }} />

      <Modal
        title={`Injection Zone: ${selectedZone?.name}`}
        open={modalOpen}
        onOk={handleSaveZone}
        onCancel={() => setModalOpen(false)}
        okText="Update Dosage"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Neurotoxin (Botox / Dysport / Xeomin)</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={100}
              step={1}
              value={editBotox}
              onChange={(v) => setEditBotox(v ?? 0)}
              addonAfter="Units"
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Dermal Filler Volume (HA / CaHA)</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={10}
              step={0.1}
              value={editFiller}
              onChange={(v) => setEditFiller(v ?? 0)}
              addonAfter="mL"
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>Product &amp; Lot Number</Text>
            <Select
              style={{ width: '100%' }}
              value={editProduct}
              onChange={setEditProduct}
              options={[
                { value: 'Botox Cosmetic (Allergan)', label: 'Botox Cosmetic (OnabotulinumtoxinA)' },
                { value: 'Dysport (Galderma)', label: 'Dysport (AbobotulinumtoxinA)' },
                { value: 'Juvederm Voluma XC', label: 'Juvederm Voluma XC (HA 20mg/ml)' },
                { value: 'Restylane Kysse', label: 'Restylane Kysse (Lips)' },
                { value: 'Radiesse (+) Calcium Hydroxylapatite', label: 'Radiesse (Collagen Stimulator)' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
