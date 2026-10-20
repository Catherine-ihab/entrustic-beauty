import { useState, useMemo, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Modal, Form, Select, Typography, message, DatePicker, Popconfirm, Tooltip } from 'antd';
import { Plus, Search, Wrench, AlertTriangle, Cpu, Edit2, Trash2, RotateCcw } from 'lucide-react';
import dayjs from 'dayjs';
import { ClinicType } from '@clinic/shared-types';
import { useAuthStore } from '../../store/auth-store';
import { SPECIALTY_LOCK } from '../../specialties';
import { useLang } from '../../lib/useLang';

const { Title } = Typography;

export interface IDevice {
  id: string;
  name: string;
  deviceType: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  lastCalibration?: string;
  nextCalibration?: string;
  status: 'active' | 'maintenance' | 'retired';
  specifications?: string;
}

// ─── Specialty-tailored equipment libraries for all 13 medical specialties ─────

export const SPECIALTY_EQUIPMENT_CATALOG: Record<
  string,
  {
    label: string;
    categories: { label: string; value: string }[];
    defaultDevices: IDevice[];
  }
> = {
  // 1. General Medicine
  [ClinicType.GENERAL_MEDICAL]: {
    label: 'General Medicine & Family Practice',
    categories: [
      { label: 'Multi-Parameter Patient Monitor', value: 'patient_monitor' },
      { label: 'Diagnostic Point-of-Care Ultrasound', value: 'ultrasound' },
      { label: '12-Lead Diagnostic ECG Machine', value: 'ecg' },
      { label: 'Autoclave & Instrument Sterilizer', value: 'sterilization' },
      { label: 'Automated External Defibrillator (AED)', value: 'defibrillator' },
      { label: 'Clinical Ultrasonic Nebulizer', value: 'nebulizer' },
    ],
    defaultDevices: [
      {
        id: 'gen-1',
        name: 'Welch Allyn Connex Spot Monitor',
        deviceType: 'patient_monitor',
        manufacturer: 'Hillrom / Baxter',
        model: 'Connex Spot 7100',
        serialNumber: 'WA-66102-2024',
        lastCalibration: '2026-08-15',
        nextCalibration: '2027-02-15',
        status: 'active',
        specifications: 'Non-invasive blood pressure, pulse oximetry SpO2, SureTemp Plus oral thermometry',
      },
      {
        id: 'gen-2',
        name: 'Mindray DP-50 Expert Portable Ultrasound',
        deviceType: 'ultrasound',
        manufacturer: 'Mindray Medical',
        model: 'DP-50 Expert',
        serialNumber: 'MR-99214-2023',
        lastCalibration: '2026-05-10',
        nextCalibration: '2026-11-10',
        status: 'active',
        specifications: 'Convex & linear probes, PW Doppler, tissue harmonic imaging',
      },
      {
        id: 'gen-3',
        name: 'GE MAC 2000 12-Lead ECG System',
        deviceType: 'ecg',
        manufacturer: 'GE Healthcare',
        model: 'MAC 2000 Resting ECG',
        serialNumber: 'GE-44019-2024',
        lastCalibration: '2026-07-01',
        nextCalibration: '2027-01-01',
        status: 'active',
        specifications: 'Marquette 12SL ECG analysis program, 7-inch color display, barcode patient entry',
      },
    ],
  },

  // 2. Dental
  [ClinicType.DENTAL]: {
    label: 'Dental & Oral Surgery',
    categories: [
      { label: 'Dental Treatment Center (Chair)', value: 'dental_unit' },
      { label: '3D CBCT & Digital Panoramic Imaging', value: 'cbct_xray' },
      { label: 'Intraoral Optical Scanner', value: 'intraoral_scanner' },
      { label: 'Ultrasonic Piezoelectric Scaler', value: 'scaler' },
      { label: 'Class B Vacuum Autoclave', value: 'autoclave' },
      { label: 'Rotary Endodontic Motor & Apex Locator', value: 'endo_motor' },
    ],
    defaultDevices: [
      {
        id: 'dent-1',
        name: 'Dentsply Sirona Intego Pro Treatment Center',
        deviceType: 'dental_unit',
        manufacturer: 'Dentsply Sirona',
        model: 'Intego Pro Ambidextrous',
        serialNumber: 'DS-48102-2024',
        lastCalibration: '2026-07-15',
        nextCalibration: '2027-01-15',
        status: 'active',
        specifications: 'Integrated apex locator, high-speed fiber-optic turbine, LED surgical light',
      },
      {
        id: 'dent-2',
        name: 'Carestream CS 8200 3D CBCT Imaging System',
        deviceType: 'cbct_xray',
        manufacturer: 'Carestream Dental',
        model: 'CS 8200 3D Extraoral',
        serialNumber: 'CS-77192-2023',
        lastCalibration: '2026-05-10',
        nextCalibration: '2026-11-10',
        status: 'active',
        specifications: 'Extended Field of View 12x10cm, 75μm high-resolution endo imaging mode',
      },
      {
        id: 'dent-3',
        name: '3Shape TRIOS 5 Wireless Intraoral Scanner',
        deviceType: 'intraoral_scanner',
        manufacturer: '3Shape',
        model: 'TRIOS 5 Pod',
        serialNumber: 'TS-99104-2024',
        lastCalibration: '2026-08-01',
        nextCalibration: '2027-02-01',
        status: 'active',
        specifications: 'ScanReady technology, smart hygiene tip, high-precision shade measurement',
      },
      {
        id: 'dent-4',
        name: 'W&H Lisa Type B Vacuum Autoclave 22L',
        deviceType: 'autoclave',
        manufacturer: 'W&H Dentalwerk',
        model: 'Lisa 500 Sterilizer',
        serialNumber: 'WH-00293-2024',
        lastCalibration: '2026-08-20',
        nextCalibration: '2027-02-20',
        status: 'active',
        specifications: 'Fractionated pre-vacuum, electronic water quality sensor, RFID cycle logging',
      },
    ],
  },

  // 3. Dermatology
  [ClinicType.DERMATOLOGY]: {
    label: 'Dermatology & Skin Disorders',
    categories: [
      { label: 'Digital Dermatoscope & Mole Mapping', value: 'dermatoscope' },
      { label: 'Liquid Nitrogen Cryosurgical Unit', value: 'cryosurgery' },
      { label: "Wood's Diagnostic Examination Lamp", value: 'woods_lamp' },
      { label: 'High-Frequency Electrocautery Unit', value: 'electrocautery' },
      { label: 'Narrowband UVB Phototherapy Unit', value: 'phototherapy' },
    ],
    defaultDevices: [
      {
        id: 'derm-1',
        name: 'DermLite DL4 Polarized Digital Dermatoscope',
        deviceType: 'dermatoscope',
        manufacturer: '3Gen DermLite',
        model: 'DL4 4th Gen',
        serialNumber: 'DL-88194-2024',
        lastCalibration: '2026-06-10',
        nextCalibration: '2027-06-10',
        status: 'active',
        specifications: 'Polarized & non-polarized illumination, pigment boost mode, smartphone camera mount',
      },
      {
        id: 'derm-2',
        name: 'Brymill Cry-Ac Liquid Nitrogen Delivery System',
        deviceType: 'cryosurgery',
        manufacturer: 'Brymill Cryogenic Systems',
        model: 'Cry-Ac-3 300ml',
        serialNumber: 'BR-22041-2023',
        lastCalibration: '2026-04-12',
        nextCalibration: '2026-10-12',
        status: 'active',
        specifications: 'Controlled liquid nitrogen delivery with precision spray apertures (A-D)',
      },
      {
        id: 'derm-3',
        name: 'Waldmann UV 100 Narrowband UVB Phototherapy',
        deviceType: 'phototherapy',
        manufacturer: 'Herbert Waldmann GmbH',
        model: 'UV 100 Canopy',
        serialNumber: 'WD-55109-2024',
        lastCalibration: '2026-07-22',
        nextCalibration: '2027-01-22',
        status: 'active',
        specifications: '311nm Narrowband UVB tubes, digital dosimeter with safety shut-off',
      },
    ],
  },

  // 4. Aesthetic Medicine
  [ClinicType.AESTHETIC]: {
    label: 'Aesthetic Medicine & Lasers',
    categories: [
      { label: 'Dual-Wavelength Laser Workstation', value: 'aesthetic_laser' },
      { label: 'Hydradermabrasion / Hydrofacial', value: 'hydrafacial' },
      { label: 'IPL Photofacial Platform', value: 'ipl' },
      { label: 'Radiofrequency Microneedling (RF)', value: 'rf_microneedle' },
      { label: 'Skin Diagnostic & Complexion Analysis', value: 'skin_analysis' },
      { label: 'Cryolipolysis Body Contouring', value: 'cryolipolysis' },
    ],
    defaultDevices: [
      {
        id: 'aes-1',
        name: 'Candela GentleMax Pro Plus Workstation',
        deviceType: 'aesthetic_laser',
        manufacturer: 'Candela Medical',
        model: 'GentleMax Pro Plus',
        serialNumber: 'CN-89421-2024',
        lastCalibration: '2026-08-10',
        nextCalibration: '2027-02-10',
        status: 'active',
        specifications: 'Dual 755nm Alex / 1064nm Nd:YAG, Dynamic Cooling Device (DCD) cryogen',
      },
      {
        id: 'aes-2',
        name: 'Hydrafacial Elite MD Syndeo',
        deviceType: 'hydrafacial',
        manufacturer: 'BeautyHealth Company',
        model: 'Syndeo Cloud-Connected',
        serialNumber: 'HF-99014-2024',
        lastCalibration: '2026-07-01',
        nextCalibration: '2027-01-01',
        status: 'active',
        specifications: 'Vortex-Fusion serum delivery, lymphatic drainage handpieces, LED red/blue light',
      },
      {
        id: 'aes-3',
        name: 'InMode Morpheus8 RF Microneedling Platform',
        deviceType: 'rf_microneedle',
        manufacturer: 'InMode Ltd.',
        model: 'Optimas Morpheus8',
        serialNumber: 'IM-30419-2024',
        lastCalibration: '2026-06-15',
        nextCalibration: '2026-12-15',
        status: 'active',
        specifications: 'Subdermal adipose remodeling device (SARD) up to 4mm depth, silicone-coated pins',
      },
      {
        id: 'aes-4',
        name: 'Lumenis Stellar M22 Multi-Application Platform',
        deviceType: 'ipl',
        manufacturer: 'Lumenis',
        model: 'Stellar M22',
        serialNumber: 'LM-40192-2023',
        lastCalibration: '2026-05-22',
        nextCalibration: '2026-11-22',
        status: 'active',
        specifications: 'Optimal Pulse Technology (OPT), ResurFX 1565nm non-ablative fractional laser',
      },
    ],
  },

  // 5. Physiotherapy
  [ClinicType.PHYSIOTHERAPY]: {
    label: 'Physiotherapy & Sports Rehab',
    categories: [
      { label: 'Shockwave Therapy (ESWT)', value: 'shockwave' },
      { label: 'Electrotherapy & TENS / EMS', value: 'electrotherapy' },
      { label: 'Therapeutic Ultrasound', value: 'ultrasound_therapy' },
      { label: 'High Intensity Laser (HIL)', value: 'physio_laser' },
      { label: 'Spinal Traction & Decompression', value: 'traction' },
      { label: 'Pneumatic Compression Boots', value: 'compression' },
    ],
    defaultDevices: [
      {
        id: 'physio-1',
        name: 'Chattanooga Intelect Neo Shockwave Unit',
        deviceType: 'shockwave',
        manufacturer: 'DJO Global',
        model: 'Neo ESWT Modular',
        serialNumber: 'CH-88204-2024',
        lastCalibration: '2026-06-15',
        nextCalibration: '2026-12-15',
        status: 'active',
        specifications: 'Radial shockwave up to 5 Bar, 21Hz frequency with D-Actor transmitter',
      },
      {
        id: 'physio-2',
        name: 'Gymna Combi 400 Electrotherapy & Ultrasound',
        deviceType: 'electrotherapy',
        manufacturer: 'GymnaUniphy',
        model: 'Combi 400 Touch',
        serialNumber: 'GY-33109-2023',
        lastCalibration: '2026-04-10',
        nextCalibration: '2026-10-10',
        status: 'active',
        specifications: 'Dual frequency 1 & 3 MHz, 2-channel interferential, TENS, NMES',
      },
      {
        id: 'physio-3',
        name: 'BTL-6000 High Intensity Laser (HIL 12W)',
        deviceType: 'physio_laser',
        manufacturer: 'BTL Industries',
        model: 'BTL-6000 Elite',
        serialNumber: 'BTL-91042-2025',
        lastCalibration: '2026-08-01',
        nextCalibration: '2027-02-01',
        status: 'active',
        specifications: '1064nm deep tissue biostimulation, analgesic pulsed mode',
      },
      {
        id: 'physio-4',
        name: 'NormaTec 3 Pulse Recovery Boots',
        deviceType: 'compression',
        manufacturer: 'Hyperice',
        model: 'NormaTec Pro 3.0',
        serialNumber: 'NT-11940-2024',
        lastCalibration: '2026-03-20',
        nextCalibration: '2026-09-20',
        status: 'active',
        specifications: '7 intensity levels, ZoneBoost biomimicry compression',
      },
    ],
  },

  // 6. Rehabilitation
  [ClinicType.REHABILITATION]: {
    label: 'Neuro & Physical Rehabilitation',
    categories: [
      { label: 'Robotic Gait Training & Body Suspension', value: 'gait_robot' },
      { label: 'Continuous Passive Motion (CPM) Machine', value: 'cpm' },
      { label: 'Functional Electrical Stimulation (FES)', value: 'fes' },
      { label: 'Motorized Tilt Table with Biofeedback', value: 'tilt_table' },
      { label: 'Rehabilitation Parallel Bars & Harness', value: 'parallel_bars' },
    ],
    defaultDevices: [
      {
        id: 'rehab-1',
        name: 'Hocoma Lokomat Pro Robotic Gait Trainer',
        deviceType: 'gait_robot',
        manufacturer: 'Hocoma / DIH Medical',
        model: 'Lokomat Pro 6.0',
        serialNumber: 'HK-77102-2024',
        lastCalibration: '2026-05-15',
        nextCalibration: '2026-11-15',
        status: 'active',
        specifications: 'Physiological gait orthosis, dynamic weight support, biofeedback virtual reality',
      },
      {
        id: 'rehab-2',
        name: 'Kinetec Prima Advance Knee CPM Unit',
        deviceType: 'cpm',
        manufacturer: 'Kinetec Medical',
        model: 'Prima Advance',
        serialNumber: 'KT-30194-2023',
        lastCalibration: '2026-06-20',
        nextCalibration: '2026-12-20',
        status: 'active',
        specifications: 'Extension/Flexion range -5° to 115°, digital handheld controller',
      },
      {
        id: 'rehab-3',
        name: 'Enraf-Nonius Manumed Motorized Tilt Table',
        deviceType: 'tilt_table',
        manufacturer: 'Enraf-Nonius',
        model: 'Manumed Postural 2-Section',
        serialNumber: 'EN-88102-2024',
        lastCalibration: '2026-07-10',
        nextCalibration: '2027-01-10',
        status: 'active',
        specifications: '0° to 90° electric inclination, secure patient thorax and leg safety strapping',
      },
    ],
  },

  // 7. Orthopedics
  [ClinicType.ORTHOPEDIC]: {
    label: 'Orthopedics & Joint Care',
    categories: [
      { label: 'Mobile C-Arm Fluoroscopy System', value: 'c_arm' },
      { label: 'Digital Orthopedic X-Ray System', value: 'ortho_xray' },
      { label: 'Dual-Energy X-Ray Absorptiometry (DEXA)', value: 'dexa' },
      { label: 'Electric Plaster Cast Saw with Vacuum', value: 'cast_saw' },
      { label: 'High-Definition Arthroscopy Tower', value: 'arthroscopy' },
    ],
    defaultDevices: [
      {
        id: 'orth-1',
        name: 'Siemens Cios Select Mobile C-Arm',
        deviceType: 'c_arm',
        manufacturer: 'Siemens Healthineers',
        model: 'Cios Select Flat Detector',
        serialNumber: 'SM-55019-2024',
        lastCalibration: '2026-08-01',
        nextCalibration: '2027-02-01',
        status: 'active',
        specifications: 'High-power mobile imaging, IDEAL dose management, laser light crosshair aimer',
      },
      {
        id: 'orth-2',
        name: 'DeSoutter CleanCast Electric Plaster Saw System',
        deviceType: 'cast_saw',
        manufacturer: 'DeSoutter Medical',
        model: 'CleanCast CC4 with HEPA Extractor',
        serialNumber: 'DS-11904-2023',
        lastCalibration: '2026-04-15',
        nextCalibration: '2026-10-15',
        status: 'active',
        specifications: 'Oscillating safety blade, HEPA dust containment extraction unit',
      },
      {
        id: 'orth-3',
        name: 'Hologic Horizon W Bone Densitometer (DEXA)',
        deviceType: 'dexa',
        manufacturer: 'Hologic Inc.',
        model: 'Horizon W Fan-Beam',
        serialNumber: 'HL-66401-2024',
        lastCalibration: '2026-07-25',
        nextCalibration: '2027-01-25',
        status: 'active',
        specifications: 'Single-pass fan-beam acquisition, vertebral fracture assessment (VFA), pediatric DEXA',
      },
    ],
  },

  // 8. Nutrition
  [ClinicType.NUTRITION]: {
    label: 'Clinical Nutrition & Dietetics',
    categories: [
      { label: 'Multi-Frequency Bioelectrical Impedance (BIA)', value: 'body_composition' },
      { label: 'Indirect Calorimetry (Metabolic Cart)', value: 'calorimeter' },
      { label: 'Precision Wireless Stadiometer & Medical Scale', value: 'stadiometer' },
      { label: 'Precision Skinfold Caliper', value: 'caliper' },
    ],
    defaultDevices: [
      {
        id: 'nut-1',
        name: 'InBody 770 Multi-Frequency Body Composition Analyzer',
        deviceType: 'body_composition',
        manufacturer: 'InBody Co., Ltd.',
        model: 'InBody 770 Medical Grade',
        serialNumber: 'IB-77041-2024',
        lastCalibration: '2026-06-01',
        nextCalibration: '2026-12-01',
        status: 'active',
        specifications: 'Direct Segmental Multi-frequency BIA (1kHz - 1MHz), phase angle, visceral fat area',
      },
      {
        id: 'nut-2',
        name: 'Cosmed Fitmate Pro Indirect Calorimeter',
        deviceType: 'calorimeter',
        manufacturer: 'COSMED Biomedical',
        model: 'Fitmate Pro Desktop',
        serialNumber: 'CS-88192-2023',
        lastCalibration: '2026-04-15',
        nextCalibration: '2026-10-15',
        status: 'active',
        specifications: 'Real-time oxygen uptake (VO2), Resting Metabolic Rate (RMR) measurement',
      },
      {
        id: 'nut-3',
        name: 'Seca 284 Wireless Ultrasonic Stadiometer',
        deviceType: 'stadiometer',
        manufacturer: 'Seca Medical',
        model: 'Seca 284 EMR-Validated',
        serialNumber: 'SC-99042-2024',
        lastCalibration: '2026-05-18',
        nextCalibration: '2026-11-18',
        status: 'active',
        specifications: 'Dual ultrasonic sensors, 300kg capacity, automatic BMI and WHO growth index',
      },
    ],
  },

  // 9. Psychology
  [ClinicType.PSYCHOLOGY]: {
    label: 'Psychology & Behavioral Health',
    categories: [
      { label: 'qEEG Neurofeedback Workstation', value: 'neurofeedback' },
      { label: 'Computerized Neuropsychological Testing Terminal', value: 'testing_terminal' },
      { label: 'Biofeedback Sensor Suite (HRV / GSR / EMG)', value: 'biofeedback' },
      { label: 'Bright Light Chronotherapy Lamp', value: 'light_therapy' },
    ],
    defaultDevices: [
      {
        id: 'psy-1',
        name: 'Deymed TruScan 24-Channel EEG / Neurofeedback',
        deviceType: 'neurofeedback',
        manufacturer: 'Deymed Diagnostic',
        model: 'TruScan 24 Pro',
        serialNumber: 'DM-20419-2024',
        lastCalibration: '2026-03-10',
        nextCalibration: '2026-09-10',
        status: 'active',
        specifications: '24-channel clinical EEG with real-time Z-score neurofeedback protocol',
      },
      {
        id: 'psy-2',
        name: 'Thought Technology ProComp Infiniti Biofeedback Suite',
        deviceType: 'biofeedback',
        manufacturer: 'Thought Technology Ltd.',
        model: 'ProComp Infiniti 8-Ch',
        serialNumber: 'TT-66104-2023',
        lastCalibration: '2026-05-20',
        nextCalibration: '2026-11-20',
        status: 'active',
        specifications: 'Heart Rate Variability (HRV), Galvanic Skin Response (GSR), surface EMG sensors',
      },
      {
        id: 'psy-3',
        name: 'Northern Light Technologies BOX Elite 10,000 Lux Lamp',
        deviceType: 'light_therapy',
        manufacturer: 'Northern Light Technologies',
        model: 'BOX Elite Chronotherapy',
        serialNumber: 'NL-10928-2024',
        lastCalibration: '2026-07-01',
        nextCalibration: '2027-01-01',
        status: 'active',
        specifications: '10,000 Lux at 14 inches, UV-blocked broad spectrum light for seasonal/affective therapy',
      },
    ],
  },

  // 10. Ophthalmology
  [ClinicType.OPHTHALMOLOGY]: {
    label: 'Ophthalmology & Eye Surgery',
    categories: [
      { label: 'Slit Lamp Biomicroscope with Tonometer', value: 'slit_lamp' },
      { label: 'Optical Coherence Tomography (OCT)', value: 'oct' },
      { label: 'Non-Mydriatic Digital Fundus Camera', value: 'fundus_camera' },
      { label: 'Auto Refracto-Keratometer', value: 'refractometer' },
      { label: 'Ophthalmic YAG Laser Workstation', value: 'yag_laser' },
    ],
    defaultDevices: [
      {
        id: 'oph-1',
        name: 'Haag-Streit BQ 900 Slit Lamp with Tonometer',
        deviceType: 'slit_lamp',
        manufacturer: 'Haag-Streit Diagnostics',
        model: 'BQ 900 LED',
        serialNumber: 'HS-41098-2023',
        lastCalibration: '2026-06-12',
        nextCalibration: '2026-12-12',
        status: 'active',
        specifications: '5-step magnification (6x-40x), Goldmann Applanation Tonometer AT 900',
      },
      {
        id: 'oph-2',
        name: 'Zeiss Cirrus HD-OCT 5000',
        deviceType: 'oct',
        manufacturer: 'Carl Zeiss Meditec',
        model: 'Cirrus HD-OCT 5000',
        serialNumber: 'CZ-90412-2024',
        lastCalibration: '2026-04-18',
        nextCalibration: '2026-10-18',
        status: 'active',
        specifications: 'Macular thickness analysis, RNFL axonal progression analysis, anterior segment OCT',
      },
      {
        id: 'oph-3',
        name: 'Topcon TRC-NW400 Non-Mydriatic Retinal Camera',
        deviceType: 'fundus_camera',
        manufacturer: 'Topcon Healthcare',
        model: 'TRC-NW400 Robotic',
        serialNumber: 'TP-33104-2024',
        lastCalibration: '2026-07-15',
        nextCalibration: '2027-01-15',
        status: 'active',
        specifications: 'Fully automated 3D tracking & auto-capture, 45° angle of view, small pupil capability (3.3mm)',
      },
    ],
  },

  // 11. ENT
  [ClinicType.ENT]: {
    label: 'Otolaryngology (ENT)',
    categories: [
      { label: 'ENT Integrated Treatment Workstation', value: 'ent_unit' },
      { label: 'Rigid & Flexible Video Endoscopy Tower', value: 'endoscopy' },
      { label: 'Diagnostic Pure Tone & Speech Audiometer', value: 'audiometer' },
      { label: 'Tympanometer & Acoustic Reflex Analyzer', value: 'tympanometer' },
    ],
    defaultDevices: [
      {
        id: 'ent-1',
        name: 'ATMOS S 61 Servant ENT Treatment Unit',
        deviceType: 'ent_unit',
        manufacturer: 'ATMOS MedizinTechnik',
        model: 'S 61 Servant Vision',
        serialNumber: 'AT-55910-2024',
        lastCalibration: '2026-05-30',
        nextCalibration: '2026-11-30',
        status: 'active',
        specifications: 'Integrated medical suction, compressed air sprayer, mirror preheater, LED headlight',
      },
      {
        id: 'ent-2',
        name: 'Interacoustics Titan Middle Ear Analyzer',
        deviceType: 'tympanometer',
        manufacturer: 'Interacoustics',
        model: 'Titan Diagnostic Suite',
        serialNumber: 'IA-10492-2023',
        lastCalibration: '2026-07-20',
        nextCalibration: '2027-01-20',
        status: 'active',
        specifications: '226 Hz & 1000 Hz high-frequency tympanometry, ipsi/contra acoustic reflexes',
      },
      {
        id: 'ent-3',
        name: 'Karl Storz Tele Pack X LED Video Endoscopy System',
        deviceType: 'endoscopy',
        manufacturer: 'Karl Storz SE & Co.',
        model: 'Tele Pack X LED Pro',
        serialNumber: 'KS-88029-2024',
        lastCalibration: '2026-08-05',
        nextCalibration: '2027-02-05',
        status: 'active',
        specifications: 'Full HD video processor, integrated LED light source, digital video recording',
      },
    ],
  },

  // 12. Pediatrics
  [ClinicType.PEDIATRICS]: {
    label: 'Pediatrics & Neonatal Care',
    categories: [
      { label: 'Infant Radiant Warmer & Incubator', value: 'incubator' },
      { label: 'LED Neonatal Phototherapy Unit (BiliBed)', value: 'bilibed' },
      { label: 'Medical Infant Digital Scale & Length Mat', value: 'infant_scale' },
      { label: 'Transcutaneous Bilirubinometer (Non-Invasive)', value: 'bilirubinometer' },
      { label: 'Pediatric Pulse Oximeter & Vital Monitor', value: 'pediatric_oximeter' },
    ],
    defaultDevices: [
      {
        id: 'ped-1',
        name: 'Dräger Isolette 8000 Infant Incubator System',
        deviceType: 'incubator',
        manufacturer: 'Dräger Medical',
        model: 'Isolette 8000 Plus',
        serialNumber: 'DG-90412-2024',
        lastCalibration: '2026-06-25',
        nextCalibration: '2026-12-25',
        status: 'active',
        specifications: 'Advanced thermoregulation, dual air curtain technology, integrated scale and servo humidity',
      },
      {
        id: 'ped-2',
        name: 'Philips BiliChek Non-Invasive Bilirubinometer',
        deviceType: 'bilirubinometer',
        manufacturer: 'Philips Healthcare',
        model: 'BiliChek Handheld System',
        serialNumber: 'PH-33019-2023',
        lastCalibration: '2026-05-10',
        nextCalibration: '2026-11-10',
        status: 'active',
        specifications: 'Multi-wavelength transcutaneous measurement, eliminates neonatal heel-stick blood draws',
      },
      {
        id: 'ped-3',
        name: 'Seca 334 Mobile Digital Baby Scale',
        deviceType: 'infant_scale',
        manufacturer: 'Seca Medical',
        model: 'Seca 334 with Measuring Rod Seca 232',
        serialNumber: 'SC-11409-2024',
        lastCalibration: '2026-07-15',
        nextCalibration: '2027-01-15',
        status: 'active',
        specifications: 'Graduation 5g, breast-milk-intake calculation (BMIF), damping system for active babies',
      },
    ],
  },

  // 13. Gynecology & Obstetrics
  [ClinicType.GYNECOLOGY]: {
    label: "Gynecology & Women's Health",
    categories: [
      { label: '3D/4D Obstetric Ultrasound System', value: 'ob_ultrasound' },
      { label: 'Digital Video Colposcope with Green Filter', value: 'colposcope' },
      { label: 'Fetal Doppler & Cardiotocograph (CTG / NST)', value: 'ctg_monitor' },
      { label: 'Motorized Gynecological Examination Chair', value: 'gynae_chair' },
      { label: 'Gynecological Cryocautery Unit', value: 'gynae_cryo' },
    ],
    defaultDevices: [
      {
        id: 'gyn-1',
        name: 'GE Healthcare Voluson E10 3D/4D Ultrasound',
        deviceType: 'ob_ultrasound',
        manufacturer: 'GE Healthcare',
        model: 'Voluson E10 BT22',
        serialNumber: 'GE-99104-2024',
        lastCalibration: '2026-08-12',
        nextCalibration: '2027-02-12',
        status: 'active',
        specifications: 'HDlive Silhouette rendering, matrix 3D transvaginal probe, automated fetal biometric measurement',
      },
      {
        id: 'gyn-2',
        name: 'Leisegang 3MVC LED Digital Video Colposcope',
        deviceType: 'colposcope',
        manufacturer: 'Leisegang Feinmechanik-Optik',
        model: '3MVC LED HD Camera',
        serialNumber: 'LG-44018-2023',
        lastCalibration: '2026-04-20',
        nextCalibration: '2026-10-20',
        status: 'active',
        specifications: '3-step magnification, green filter for vessel visualization, integrated HD video capture',
      },
      {
        id: 'gyn-3',
        name: 'Huntleigh Sonicaid Team3 Fetal / Maternal CTG Monitor',
        deviceType: 'ctg_monitor',
        manufacturer: 'Huntleigh Healthcare',
        model: 'Team3 Series Twin Monitor',
        serialNumber: 'HL-77194-2024',
        lastCalibration: '2026-06-18',
        nextCalibration: '2026-12-18',
        status: 'active',
        specifications: 'Twin fetal heart rate monitoring, high-sensitivity wide-beam ultrasound transducers, Dawes-Redman analysis',
      },
    ],
  },
};

export function DevicesView() {
  const { clinic } = useAuthStore();
  const currentSpecialty =
    (clinic?.clinicType as ClinicType) || SPECIALTY_LOCK || ClinicType.GENERAL_MEDICAL;

  // Resolve equipment catalog strictly according to the active clinic specialty
  const specialtyCatalog = useMemo(() => {
    return SPECIALTY_EQUIPMENT_CATALOG[currentSpecialty] || SPECIALTY_EQUIPMENT_CATALOG[ClinicType.GENERAL_MEDICAL];
  }, [currentSpecialty]);

  const storageKey = `clinic_devices_${currentSpecialty}_${clinic?.id || 'default'}`;

  // Initialize devices from localStorage or specialty defaults
  const [devices, setDevices] = useState<IDevice[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return specialtyCatalog.defaultDevices;
  });

  // When specialty changes, reload devices
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDevices(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setDevices(specialtyCatalog.defaultDevices);
  }, [storageKey, specialtyCatalog]);

  // Save devices to localStorage whenever updated
  const persistDevices = (updated: IDevice[]) => {
    setDevices(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IDevice | null>(null);
  const [form] = Form.useForm();
  const [searchQuery, setSearchQuery] = useState('');
  const { tx } = useLang();

  const filteredDevices = useMemo(() => {
    if (!searchQuery) return devices;
    const q = searchQuery.toLowerCase();
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.deviceType.toLowerCase().includes(q) ||
        d.manufacturer?.toLowerCase().includes(q) ||
        d.serialNumber?.toLowerCase().includes(q) ||
        d.model?.toLowerCase().includes(q)
    );
  }, [devices, searchQuery]);

  // Open modal for creating new device
  const handleOpenCreate = () => {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      deviceType: specialtyCatalog.categories[0]?.value,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing device
  const handleOpenEdit = (device: IDevice) => {
    setEditingDevice(device);
    form.resetFields();
    form.setFieldsValue({
      name: device.name,
      deviceType: device.deviceType,
      manufacturer: device.manufacturer,
      model: device.model,
      serialNumber: device.serialNumber,
      specifications: device.specifications,
      status: device.status,
      lastCalibration: device.lastCalibration ? dayjs(device.lastCalibration) : undefined,
      nextCalibration: device.nextCalibration ? dayjs(device.nextCalibration) : undefined,
    });
    setIsModalOpen(true);
  };

  // Submit create or edit
  const handleSubmitForm = (values: any) => {
    const formatted: IDevice = {
      id: editingDevice ? editingDevice.id : `dev-${Date.now()}`,
      name: values.name,
      deviceType: values.deviceType,
      manufacturer: values.manufacturer,
      model: values.model,
      serialNumber: values.serialNumber,
      specifications: values.specifications,
      lastCalibration: values.lastCalibration ? values.lastCalibration.format('YYYY-MM-DD') : undefined,
      nextCalibration: values.nextCalibration ? values.nextCalibration.format('YYYY-MM-DD') : undefined,
      status: values.status || 'active',
    };

    if (editingDevice) {
      const updated = devices.map((d) => (d.id === editingDevice.id ? formatted : d));
      persistDevices(updated);
      message.success(tx('تم تحديث بيانات الجهاز', 'Device details updated successfully'));
    } else {
      persistDevices([formatted, ...devices]);
      message.success('Clinical equipment registered successfully');
    }

    setIsModalOpen(false);
    setEditingDevice(null);
    form.resetFields();
  };

  // Delete device
  const handleDelete = (id: string) => {
    const updated = devices.filter((d) => d.id !== id);
    persistDevices(updated);
    message.success('Medical device deleted successfully');
  };

  // Restore catalog defaults
  const handleRestoreDefaults = () => {
    persistDevices(specialtyCatalog.defaultDevices);
    message.info(tx('تمت استعادة أجهزة التخصص الافتراضية', 'Reset equipment list to specialty defaults'));
  };

  const columns = [
    {
      title: tx('الجهاز ومحطة العمل', 'Equipment & Workstation'),
      key: 'name',
      render: (_: any, r: IDevice) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cpu size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              {r.manufacturer} {r.model ? `· ${r.model}` : ''}
            </div>
            {r.specifications && (
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{r.specifications}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: tx('الفئة والتصنيف', 'Category'),
      dataIndex: 'deviceType',
      key: 'deviceType',
      render: (t: string) => (
        <Tag color="blue" style={{ textTransform: 'capitalize', borderRadius: 6, fontWeight: 500 }}>
          {t ? t.replace(/_/g, ' ') : tx('عام', 'General')}
        </Tag>
      ),
    },
    {
      title: tx('الرقم التسلسلي (SN)', 'Serial Number'),
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      render: (sn: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#334155' }}>
          {sn || '—'}
        </span>
      ),
    },
    {
      title: tx('حالة المعايرة الدورية', 'Calibration Health'),
      dataIndex: 'nextCalibration',
      key: 'nextCalibration',
      render: (d: string) => {
        if (!d) return '—';
        const isOverdue = dayjs(d).isBefore(dayjs());
        return (
          <span style={{ color: isOverdue ? '#DC2626' : '#059669', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {isOverdue && <AlertTriangle size={13} />}
            {dayjs(d).format('YYYY-MM-DD')}
            {isOverdue && <Tag color="error" style={{ fontSize: 9, lineHeight: '14px', padding: '0 4px', marginInlineStart: 4 }}>{tx('متأخرة', 'OVERDUE')}</Tag>}
          </span>
        );
      },
    },
    {
      title: tx('الحالة التشغيلية', 'Operational Status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: IDevice['status']) => {
        if (s === 'active') return <Tag color="green">{tx('يعمل بكفاءة', 'Operational')}</Tag>;
        if (s === 'maintenance') return <Tag color="orange" icon={<Wrench size={11} />}>{tx('قيد الصيانة', 'In Maintenance')}</Tag>;
        return <Tag color="default">{tx('خارج الخدمة', 'Decommissioned')}</Tag>;
      },
    },
    {
      title: tx('إجراءات', 'Actions'),
      key: 'actions',
      render: (_: any, r: IDevice) => (
        <Space size="small">
          <Tooltip title={tx('تعديل بيانات الجهاز', 'Edit Device Details')}>
            <Button
              type="text"
              size="small"
              icon={<Edit2 size={15} color="#2563EB" />}
              onClick={() => handleOpenEdit(r)}
            />
          </Tooltip>
          <Tooltip title={tx('حذف الجهاز', 'Delete Device')}>
            <Popconfirm
              title={tx('حذف هذا الجهاز الطبي؟', 'Delete Medical Device')}
              description={tx(`هل أنت متأكد من حذف "${r.name}"؟`, `Are you sure you want to delete "${r.name}"?`)}
              okText={tx('حذف', 'Delete')}
              cancelText={tx('إلغاء', 'Cancel')}
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(r.id)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={15} />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Title level={4} style={{ margin: 0, color: '#0F172A' }}>
              {tx('أجهزة العيادة والمعايرة والتجهيزات الطبية', 'Specialty Equipment & Medical Devices')}
            </Title>
            <Tag color="cyan" style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
              {specialtyCatalog.label}
            </Tag>
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {tx('عرض أجهزة الليزر والمحطات الطبية، ومواعيد المعايرة والصيانة الدورية للعيادة.', 'Showing clinical devices, maintenance schedules, and calibrators configured for this specialty.')}
          </div>
        </div>
        <Space>
          <Input
            placeholder={tx('بحث في الأجهزة، السيريال، الشركة المصنعة...', 'Search devices, serial, manufacturer...')}
            prefix={<Search size={14} color="#94A3B8" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 230, borderRadius: 8 }}
          />
          <Tooltip title={tx('استعادة أجهزة التخصص الافتراضية', 'Reset list to default specialty devices')}>
            <Button icon={<RotateCcw size={14} />} onClick={handleRestoreDefaults}>
              {tx('إعادة الافتراضي', 'Reset Defaults')}
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={handleOpenCreate}
            style={{ height: 38, fontWeight: 600, backgroundColor: '#be185d', borderColor: '#be185d', borderRadius: 8 }}
          >
            {tx('+ تسجيل جهاز جديد', 'Register Equipment')}
          </Button>
        </Space>
      </div>

      <Table
        dataSource={filteredDevices}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 8 }}
        style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
      />

      {/* Registration & Edit Modal tailored to the active specialty */}
      <Modal
        title={editingDevice ? tx(`تعديل بيانات الجهاز — ${editingDevice.name}`, `Edit Equipment — ${editingDevice.name}`) : tx(`تسجيل جهاز طبي جديد — ${specialtyCatalog.label}`, `Register Clinical Equipment — ${specialtyCatalog.label}`)}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingDevice(null);
        }}
        onOk={() => form.submit()}
        okText={editingDevice ? tx('حفظ التعديلات', 'Save Changes') : tx('تسجيل الجهاز', 'Register Equipment')}
        cancelText={tx('إلغاء', 'Cancel')}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitForm} style={{ marginTop: 14 }}>
          <Form.Item name="name" label={tx('اسم الجهاز / المحطة', 'Equipment / Workstation Name')} rules={[{ required: true, message: tx('برجاء إدخال اسم الجهاز', 'Please enter equipment name') }]}>
            <Input placeholder={`e.g. ${specialtyCatalog.defaultDevices[0]?.name || 'Clinical Unit'}`} />
          </Form.Item>

          <Form.Item name="deviceType" label={tx('تصنيف الجهاز', 'Specialty Equipment Category')} rules={[{ required: true, message: tx('برجاء اختيار التصنيف', 'Please select category') }]}>
            <Select options={specialtyCatalog.categories} placeholder={tx('اختر تصنيف الجهاز', 'Select specialty equipment category')} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="manufacturer" label={tx('الشركة المصنعة', 'Manufacturer')}>
              <Input placeholder="e.g. Candela, Lumenis, InMode, Alma..." />
            </Form.Item>
            <Form.Item name="model" label={tx('الموديل / الفئة', 'Model Number / Series')}>
              <Input placeholder="e.g. GentleMax Pro Plus" />
            </Form.Item>
          </div>

          <Form.Item name="serialNumber" label={tx('الرقم التسلسلي (Serial Number)', 'Serial / Asset Tag Number')}>
            <Input placeholder="e.g. SN-2026-90412" />
          </Form.Item>

          <Form.Item name="specifications" label={tx('المواصفات الفنية والسريرية', 'Clinical Technical Specifications')}>
            <Input.TextArea rows={2} placeholder={tx('مثال: الطول الموجي، طاقة الليزر، حجم البقعة (Spot size)...', 'e.g. Output power, laser wavelength, pulse frequency, probe sizes...')} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="lastCalibration" label={tx('تاريخ آخر معايرة', 'Last Biomedical Calibration')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="nextCalibration" label={tx('تاريخ المعايرة القادمة', 'Next Calibration Due Date')}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="status" label={tx('الحالة التشغيلية للجهاز', 'Operational Status')} initialValue="active">
            <Select
              options={[
                { label: tx('يعمل بكفاءة (جاهز)', 'Operational (Active)'), value: 'active' },
                { label: tx('تحت الصيانة / المعايرة', 'Under Maintenance / Service'), value: 'maintenance' },
                { label: tx('خارج الخدمة (متقاعد)', 'Decommissioned'), value: 'retired' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
