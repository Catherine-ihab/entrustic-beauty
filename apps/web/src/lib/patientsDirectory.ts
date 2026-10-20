// Centralized Clinic Patients Directory for Session Recording & Search
export interface RegisteredPatient {
  id: string;
  patientNumber: string; // e.g. PAT-00160
  name: string;          // e.g. سلمى إبراهيم
  phone: string;         // e.g. 01012345678
  gender?: string;
}

export const DEFAULT_REGISTERED_PATIENTS: RegisteredPatient[] = [
  {
    id: 'p-salma',
    patientNumber: 'PAT-00160',
    name: 'سلمى إبراهيم',
    phone: '01012345678',
    gender: 'أنثى',
  },
  {
    id: 'p-lina',
    patientNumber: 'PAT-00104',
    name: 'لينا الحسن',
    phone: '01023456789',
    gender: 'أنثى',
  },
  {
    id: 'p-dina',
    patientNumber: 'PAT-00088',
    name: 'دينا مصطفى',
    phone: '01098765432',
    gender: 'أنثى',
  },
  {
    id: 'p-farida',
    patientNumber: 'PAT-00089',
    name: 'فريدة صبري',
    phone: '01123456780',
    gender: 'أنثى',
  },
  {
    id: 'p-maryam',
    patientNumber: 'PAT-00120',
    name: 'مريم الصاوي',
    phone: '01234567891',
    gender: 'أنثى',
  },
  {
    id: 'p-rania',
    patientNumber: 'PAT-00055',
    name: 'رانيا توفيق',
    phone: '01055566778',
    gender: 'أنثى',
  },
  {
    id: 'p-heba',
    patientNumber: 'PAT-00098',
    name: 'هبة المنشاوي',
    phone: '01188899001',
    gender: 'أنثى',
  },
  {
    id: 'p-nour',
    patientNumber: 'PAT-00072',
    name: 'نور الشربيني',
    phone: '01222334455',
    gender: 'أنثى',
  },
  {
    id: 'p-yasmeen',
    patientNumber: 'PAT-00145',
    name: 'ياسمين صبري',
    phone: '01066778899',
    gender: 'أنثى',
  },
  {
    id: 'p-hoda',
    patientNumber: 'PAT-00210',
    name: 'هدى عبد العزيز',
    phone: '01144556677',
    gender: 'أنثى',
  },
  {
    id: 'p-sara',
    patientNumber: 'PAT-00002',
    name: 'سارة السيد',
    phone: '01119876543',
    gender: 'أنثى',
  },
  {
    id: 'p-ahmad',
    patientNumber: 'PAT-00001',
    name: 'أحمد حسن السيد',
    phone: '01001234567',
    gender: 'ذكر',
  },
];

const LS_PATIENTS_DIRECTORY = 'clinic_registered_patients_directory_v1';

export function getRegisteredPatients(): RegisteredPatient[] {
  try {
    const stored = localStorage.getItem(LS_PATIENTS_DIRECTORY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading patients directory:', e);
  }
  return DEFAULT_REGISTERED_PATIENTS;
}

export function saveRegisteredPatient(patient: RegisteredPatient): void {
  try {
    const current = getRegisteredPatients();
    const existingIndex = current.findIndex(
      (p) => p.patientNumber === patient.patientNumber || p.id === patient.id
    );
    let updated: RegisteredPatient[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...patient };
    } else {
      updated = [patient, ...current];
    }
    localStorage.setItem(LS_PATIENTS_DIRECTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving patient to directory:', e);
  }
}
