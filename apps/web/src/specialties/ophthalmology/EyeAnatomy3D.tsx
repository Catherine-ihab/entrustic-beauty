import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card, Tag, Space, Typography, Button, Modal, Radio, Input } from 'antd';
import { RotateCw } from 'lucide-react';
import type { SpecialtyComponentProps } from '../types';

const { Text } = Typography;

export interface EyeStructure {
  id: string;
  name: string;
  status: string;
  notes?: string;
}

export function EyeAnatomy3D({ readonly = false }: SpecialtyComponentProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedStructure, setSelectedStructure] = useState<EyeStructure | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const iopOd = 16;
  const iopOs = 15;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 550;
    const height = 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 5, 10);
    scene.add(dir);

    // 3D Eyeball Group
    const eyeGroup = new THREE.Group();
    scene.add(eyeGroup);

    // 1. Sclera (White outer globe)
    const scleraGeom = new THREE.SphereGeometry(2.0, 32, 32);
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.1,
      metalness: 0.1,
    });
    const scleraMesh = new THREE.Mesh(scleraGeom, scleraMat);
    scleraMesh.userData = { id: 'sclera', name: 'Sclera & Conjunctiva' };
    eyeGroup.add(scleraMesh);

    // 2. Cornea (Transparent anterior dome)
    const corneaGeom = new THREE.SphereGeometry(1.15, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const corneaMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      ior: 1.376, // Physiological corneal refractive index
    });
    const corneaMesh = new THREE.Mesh(corneaGeom, corneaMat);
    corneaMesh.position.set(0, 0, 1.4);
    corneaMesh.userData = { id: 'cornea', name: 'Anterior Cornea' };
    eyeGroup.add(corneaMesh);

    // 3. Iris (Colored aperture disc)
    const irisGeom = new THREE.RingGeometry(0.35, 1.0, 32);
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Vibrant blue iris
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const irisMesh = new THREE.Mesh(irisGeom, irisMat);
    irisMesh.position.set(0, 0, 1.7);
    irisMesh.userData = { id: 'iris', name: 'Iris & Pupil Aperture' };
    eyeGroup.add(irisMesh);

    // 4. Pupil (Black inner core)
    const pupilGeom = new THREE.CircleGeometry(0.34, 32);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const pupilMesh = new THREE.Mesh(pupilGeom, pupilMat);
    pupilMesh.position.set(0, 0, 1.71);
    pupilMesh.userData = { id: 'pupil', name: 'Pupil (Light Reflex)' };
    eyeGroup.add(pupilMesh);

    // 5. Crystalline Lens (Posterior to pupil)
    const lensGeom = new THREE.SphereGeometry(0.65, 32, 16);
    lensGeom.scale(1, 1, 0.45);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      transmission: 0.8,
      transparent: true,
      roughness: 0.1,
    });
    const lensMesh = new THREE.Mesh(lensGeom, lensMat);
    lensMesh.position.set(0, 0, 1.2);
    lensMesh.userData = { id: 'lens', name: 'Crystalline Lens (Cataract Assessment)' };
    eyeGroup.add(lensMesh);

    // 6. Optic Nerve cylinder (Posterior pole)
    const opticGeom = new THREE.CylinderGeometry(0.3, 0.35, 1.5, 16);
    const opticMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
    const opticMesh = new THREE.Mesh(opticGeom, opticMat);
    opticMesh.position.set(0, 0, -2.5);
    opticMesh.rotation.x = Math.PI / 2;
    opticMesh.userData = { id: 'optic_nerve', name: 'Optic Nerve & Disc (Glaucoma Cup/Disc)' };
    eyeGroup.add(opticMesh);

    // Interactive Drag
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
      eyeGroup.rotation.y += dx * 0.01;
      eyeGroup.rotation.x += dy * 0.01;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Raycast Structures
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(eyeGroup.children);
      if (hits.length > 0) {
        const item = hits[0].object;
        if (item.userData?.id) {
          setSelectedStructure({
            id: item.userData.id,
            name: item.userData.name,
            status: 'Normal / Physiological',
          });
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

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span style={{ fontWeight: 600 }}>3D Interactive Ocular Globe &amp; Anterior Chamber</span>
            <Tag color="cyan">Ophthalmology 3D</Tag>
          </Space>
          <Space>
            <Tag color="green">IOP OD: {iopOd} mmHg</Tag>
            <Tag color="green">IOP OS: {iopOs} mmHg</Tag>
          </Space>
        </div>
      }
      extra={
        <Button
          size="small"
          icon={<RotateCw size={12} />}
          onClick={() => {
            if (cameraRef.current) cameraRef.current.position.set(0, 0, 7.5);
          }}
        >
          Reset View
        </Button>
      }
      bodyStyle={{ padding: 0 }}
    >
      <div ref={mountRef} style={{ width: '100%', height: 400, cursor: 'grab' }} />

      <Modal
        title={`Ocular Structure: ${selectedStructure?.name}`}
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
        okText="Confirm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
          <Text strong>Clinical Finding / Pathological State</Text>
          <Radio.Group defaultValue="normal">
            <Space direction="vertical">
              <Radio value="normal">Normal / Clear</Radio>
              <Radio value="cataract">Nuclear Sclerotic Cataract (Lens)</Radio>
              <Radio value="corneal_dystrophy">Corneal Abrasion / Dystrophy</Radio>
              <Radio value="glaucoma_cupping">Pathological Cup-to-Disc Ratio &gt; 0.6</Radio>
              <Radio value="diabetic_retinopathy">Non-Proliferative Retinopathy (Microaneurysms)</Radio>
            </Space>
          </Radio.Group>
          <Input.TextArea placeholder="Slit lamp or ophthalmoscopy observations..." rows={2} />
        </div>
      </Modal>
    </Card>
  );
}
