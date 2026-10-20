/**
 * Lab Samples & Results Tracking — shared DTOs (clinic-scoped).
 */

export type LabRequestStatus = 'ordered' | 'collected' | 'in_progress' | 'completed' | 'cancelled';
export type LabPriority = 'routine' | 'urgent' | 'stat';
export type ResultFlag = 'low' | 'normal' | 'high';

export interface ILabTest {
  id: string;
  name: string;
  category?: string;
  sampleType?: string;
  sampleTube?: string;
  unit?: string;
  referenceRange?: string;
  turnaroundHours?: number;
  isActive: boolean;
}

export interface CreateLabTestDto {
  name: string;
  category?: string;
  sampleType?: string;
  sampleTube?: string;
  unit?: string;
  referenceRange?: string;
  turnaroundHours?: number;
}

export interface UpdateLabTestDto {
  name?: string;
  category?: string;
  sampleType?: string;
  sampleTube?: string;
  unit?: string;
  referenceRange?: string;
  turnaroundHours?: number;
  isActive?: boolean;
}

export interface ILabRequestItem {
  id: string;
  testId: string;
  testName: string;
  status: LabRequestStatus;
  resultValue?: string;
  resultUnit?: string;
  resultFlag?: ResultFlag;
  resultNotes?: string;
  resultedBy?: string;
  resultedAt?: string;
  referenceRange?: string;
}

export interface ILabRequest {
  id: string;
  patientId: string;
  patientName?: string;
  patientNumber?: string;
  requestNumber: string;
  requestedBy?: string;
  requestedAt: string;
  status: LabRequestStatus;
  priority: LabPriority;
  clinicalNotes?: string;
  collectedAt?: string;
  collectedBy?: string;
  labTechnician?: string;
  completedAt?: string;
  items: ILabRequestItem[];
}

export interface ILabRequestSummary {
  id: string;
  patientId: string;
  patientName?: string;
  patientNumber?: string;
  requestNumber: string;
  requestedAt: string;
  status: LabRequestStatus;
  priority: LabPriority;
  clinicalNotes?: string;
  collectedAt?: string;
  completedAt?: string;
  itemCount: number;
  completedCount: number;
}

export interface CreateLabRequestDto {
  patientId: string;
  visitId?: string;
  priority?: LabPriority;
  clinicalNotes?: string;
  labTechnicianId?: string;
  testIds: string[];
}

export interface UpdateLabRequestDto {
  status?: LabRequestStatus;
  labTechnicianId?: string;
}

export interface UpdateLabRequestItemDto {
  status?: LabRequestStatus;
  resultValue?: string;
  resultUnit?: string;
  resultFlag?: ResultFlag;
  resultNotes?: string;
}