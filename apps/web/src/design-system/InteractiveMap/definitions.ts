import { MapDefinition } from './types';

// ─── Human Body Front Map ─────────────────────────────────────────────────────

export const BODY_FRONT_MAP: MapDefinition = {
  id: 'body-front',
  title: 'Human Body (Anterior View)',
  viewBox: '0 0 300 500',
  regions: [
    { id: 'head', label: 'Head & Cranium', rect: { x: 125, y: 15, width: 50, height: 50, rx: 25 }, group: 'Head/Neck' },
    { id: 'neck', label: 'Neck / Cervical', rect: { x: 135, y: 70, width: 30, height: 25, rx: 6 }, group: 'Head/Neck' },
    { id: 'chest', label: 'Chest / Thorax', rect: { x: 105, y: 100, width: 90, height: 60, rx: 12 }, group: 'Torso' },
    { id: 'abdomen', label: 'Abdomen', rect: { x: 110, y: 165, width: 80, height: 50, rx: 10 }, group: 'Torso' },
    { id: 'pelvis', label: 'Pelvis / Groin', rect: { x: 115, y: 220, width: 70, height: 40, rx: 10 }, group: 'Torso' },
    
    // Arms
    { id: 'shoulder_r', label: 'Right Shoulder', rect: { x: 70, y: 100, width: 30, height: 35, rx: 8 }, group: 'Upper Limbs' },
    { id: 'shoulder_l', label: 'Left Shoulder', rect: { x: 200, y: 100, width: 30, height: 35, rx: 8 }, group: 'Upper Limbs' },
    { id: 'arm_r', label: 'Right Arm (Bicep)', rect: { x: 65, y: 140, width: 28, height: 50, rx: 8 }, group: 'Upper Limbs' },
    { id: 'arm_l', label: 'Left Arm (Bicep)', rect: { x: 207, y: 140, width: 28, height: 50, rx: 8 }, group: 'Upper Limbs' },
    { id: 'elbow_r', label: 'Right Elbow', rect: { x: 62, y: 195, width: 26, height: 25, rx: 6 }, group: 'Upper Limbs' },
    { id: 'elbow_l', label: 'Left Elbow', rect: { x: 212, y: 195, width: 26, height: 25, rx: 6 }, group: 'Upper Limbs' },
    { id: 'forearm_r', label: 'Right Forearm', rect: { x: 58, y: 225, width: 26, height: 50, rx: 8 }, group: 'Upper Limbs' },
    { id: 'forearm_l', label: 'Left Forearm', rect: { x: 216, y: 225, width: 26, height: 50, rx: 8 }, group: 'Upper Limbs' },
    { id: 'hand_r', label: 'Right Hand', rect: { x: 52, y: 280, width: 28, height: 35, rx: 8 }, group: 'Upper Limbs' },
    { id: 'hand_l', label: 'Left Hand', rect: { x: 220, y: 280, width: 28, height: 35, rx: 8 }, group: 'Upper Limbs' },

    // Legs
    { id: 'thigh_r', label: 'Right Thigh (Femur/Quad)', rect: { x: 110, y: 265, width: 36, height: 85, rx: 10 }, group: 'Lower Limbs' },
    { id: 'thigh_l', label: 'Left Thigh (Femur/Quad)', rect: { x: 154, y: 265, width: 36, height: 85, rx: 10 }, group: 'Lower Limbs' },
    { id: 'knee_r', label: 'Right Knee (Patella)', rect: { x: 112, y: 355, width: 32, height: 26, rx: 8 }, group: 'Lower Limbs' },
    { id: 'knee_l', label: 'Left Knee (Patella)', rect: { x: 156, y: 355, width: 32, height: 26, rx: 8 }, group: 'Lower Limbs' },
    { id: 'leg_r', label: 'Right Lower Leg (Shin/Calf)', rect: { x: 114, y: 386, width: 28, height: 70, rx: 8 }, group: 'Lower Limbs' },
    { id: 'leg_l', label: 'Left Lower Leg (Shin/Calf)', rect: { x: 158, y: 386, width: 28, height: 70, rx: 8 }, group: 'Lower Limbs' },
    { id: 'foot_r', label: 'Right Ankle & Foot', rect: { x: 108, y: 460, width: 34, height: 25, rx: 6 }, group: 'Lower Limbs' },
    { id: 'foot_l', label: 'Left Ankle & Foot', rect: { x: 158, y: 460, width: 34, height: 25, rx: 6 }, group: 'Lower Limbs' },
  ],
};

// ─── Human Body Back Map ──────────────────────────────────────────────────────

export const BODY_BACK_MAP: MapDefinition = {
  id: 'body-back',
  title: 'Human Body (Posterior View)',
  viewBox: '0 0 300 500',
  regions: [
    { id: 'head_back', label: 'Occiput / Back of Head', rect: { x: 125, y: 15, width: 50, height: 50, rx: 25 }, group: 'Head/Neck' },
    { id: 'cervical_spine', label: 'Cervical Spine (C1-C7)', rect: { x: 140, y: 70, width: 20, height: 25, rx: 5 }, group: 'Spine' },
    { id: 'thoracic_spine', label: 'Thoracic Spine (T1-T12)', rect: { x: 142, y: 100, width: 16, height: 75, rx: 4 }, group: 'Spine' },
    { id: 'lumbar_spine', label: 'Lumbar Spine (L1-L5)', rect: { x: 142, y: 180, width: 16, height: 45, rx: 4 }, group: 'Spine' },
    { id: 'sacrum_coccyx', label: 'Sacrum & Coccyx', rect: { x: 140, y: 230, width: 20, height: 30, rx: 4 }, group: 'Spine' },
    
    // Back muscles
    { id: 'upper_back_r', label: 'Right Trapezius / Rhomboid', rect: { x: 95, y: 100, width: 42, height: 45, rx: 8 }, group: 'Back' },
    { id: 'upper_back_l', label: 'Left Trapezius / Rhomboid', rect: { x: 163, y: 100, width: 42, height: 45, rx: 8 }, group: 'Back' },
    { id: 'lat_r', label: 'Right Latissimus Dorsi', rect: { x: 100, y: 150, width: 38, height: 55, rx: 8 }, group: 'Back' },
    { id: 'lat_l', label: 'Left Latissimus Dorsi', rect: { x: 162, y: 150, width: 38, height: 55, rx: 8 }, group: 'Back' },
    { id: 'glute_r', label: 'Right Gluteus', rect: { x: 105, y: 225, width: 42, height: 45, rx: 12 }, group: 'Pelvis' },
    { id: 'glute_l', label: 'Left Gluteus', rect: { x: 153, y: 225, width: 42, height: 45, rx: 12 }, group: 'Pelvis' },

    // Lower limbs back
    { id: 'hamstring_r', label: 'Right Hamstring', rect: { x: 110, y: 275, width: 36, height: 80, rx: 10 }, group: 'Lower Limbs' },
    { id: 'hamstring_l', label: 'Left Hamstring', rect: { x: 154, y: 275, width: 36, height: 80, rx: 10 }, group: 'Lower Limbs' },
    { id: 'calf_r', label: 'Right Gastrocnemius (Calf)', rect: { x: 114, y: 380, width: 28, height: 75, rx: 8 }, group: 'Lower Limbs' },
    { id: 'calf_l', label: 'Left Gastrocnemius (Calf)', rect: { x: 158, y: 380, width: 28, height: 75, rx: 8 }, group: 'Lower Limbs' },
    { id: 'achilles_r', label: 'Right Achilles Tendon', rect: { x: 120, y: 460, width: 16, height: 25, rx: 4 }, group: 'Lower Limbs' },
    { id: 'achilles_l', label: 'Left Achilles Tendon', rect: { x: 164, y: 460, width: 16, height: 25, rx: 4 }, group: 'Lower Limbs' },
  ],
};

// ─── Facial Aesthetic & Dermatology Zones Map ─────────────────────────────────

export const FACE_ZONES_MAP: MapDefinition = {
  id: 'face-zones',
  title: 'Facial Anatomy & Injection Zones',
  viewBox: '0 0 300 360',
  regions: [
    { id: 'forehead_upper', label: 'Upper Forehead', rect: { x: 90, y: 35, width: 120, height: 35, rx: 12 }, group: 'Upper Face' },
    { id: 'glabella', label: 'Glabella / Frown Lines', rect: { x: 130, y: 75, width: 40, height: 30, rx: 8 }, group: 'Upper Face' },
    { id: 'temple_r', label: 'Right Temple', rect: { x: 55, y: 75, width: 35, height: 45, rx: 10 }, group: 'Upper Face' },
    { id: 'temple_l', label: 'Left Temple', rect: { x: 210, y: 75, width: 35, height: 45, rx: 10 }, group: 'Upper Face' },
    { id: 'crows_feet_r', label: "Right Lateral Canthus (Crow's Feet)", rect: { x: 65, y: 125, width: 30, height: 25, rx: 6 }, group: 'Periorbital' },
    { id: 'crows_feet_l', label: "Left Lateral Canthus (Crow's Feet)", rect: { x: 205, y: 125, width: 30, height: 25, rx: 6 }, group: 'Periorbital' },
    { id: 'tear_trough_r', label: 'Right Tear Trough / Infraorbital', rect: { x: 100, y: 125, width: 40, height: 22, rx: 6 }, group: 'Midface' },
    { id: 'tear_trough_l', label: 'Left Tear Trough / Infraorbital', rect: { x: 160, y: 125, width: 40, height: 22, rx: 6 }, group: 'Midface' },
    { id: 'nose_bridge', label: 'Nose (Dorsum / Tip)', rect: { x: 135, y: 110, width: 30, height: 60, rx: 8 }, group: 'Midface' },
    { id: 'cheek_r', label: 'Right Malar & Zygomatic Cheek', rect: { x: 75, y: 155, width: 50, height: 45, rx: 12 }, group: 'Midface' },
    { id: 'cheek_l', label: 'Left Malar & Zygomatic Cheek', rect: { x: 175, y: 155, width: 50, height: 45, rx: 12 }, group: 'Midface' },
    { id: 'nasolabial_r', label: 'Right Nasolabial Fold', rect: { x: 115, y: 175, width: 22, height: 40, rx: 6 }, group: 'Lower Face' },
    { id: 'nasolabial_l', label: 'Left Nasolabial Fold', rect: { x: 163, y: 175, width: 22, height: 40, rx: 6 }, group: 'Lower Face' },
    { id: 'lips_upper', label: 'Upper Lip (Vermilion & Philtrum)', rect: { x: 120, y: 220, width: 60, height: 18, rx: 6 }, group: 'Perioral' },
    { id: 'lips_lower', label: 'Lower Lip (Body & Border)', rect: { x: 122, y: 242, width: 56, height: 18, rx: 6 }, group: 'Perioral' },
    { id: 'marionette_r', label: 'Right Marionette Line', rect: { x: 110, y: 245, width: 18, height: 35, rx: 5 }, group: 'Lower Face' },
    { id: 'marionette_l', label: 'Left Marionette Line', rect: { x: 172, y: 245, width: 18, height: 35, rx: 5 }, group: 'Lower Face' },
    { id: 'chin', label: 'Mentalis / Chin', rect: { x: 125, y: 268, width: 50, height: 32, rx: 10 }, group: 'Lower Face' },
    { id: 'jawline_r', label: 'Right Mandibular Jawline / Masseter', rect: { x: 65, y: 210, width: 45, height: 75, rx: 12 }, group: 'Jawline' },
    { id: 'jawline_l', label: 'Left Mandibular Jawline / Masseter', rect: { x: 190, y: 210, width: 45, height: 75, rx: 12 }, group: 'Jawline' },
    { id: 'submental', label: 'Submental (Double Chin area)', rect: { x: 120, y: 305, width: 60, height: 26, rx: 8 }, group: 'Neck' },
  ],
};
