/**
 * Garage Service - local-only storage for the self-hosted stack
 */

import { hasLocalStorage, loadLocalUser, readLocalJson, writeLocalJson } from '@/lib/localBrowserStore';

export interface GarageVehicle {
  id: string;
  user_id: string;
  year: string;
  make: string;
  model: string;
  vin?: string;
  nickname?: string;
  mileage?: number;
  last_service_date?: string;
  created_at: string;
}

export interface DiagnosisRecord {
  id: string;
  user_id: string;
  vehicle_id?: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  problem: string;
  conversation: Array<{
    role: 'user' | 'model';
    text: string;
    timestamp?: string;
  }>;
  diagnosis_summary?: string;
  recommended_parts?: Array<{
    name: string;
    amazonUrl?: string;
  }>;
  status: 'active' | 'resolved' | 'archived';
  created_at: string;
}

type GarageStore = {
  vehicles: GarageVehicle[];
  diagnoses: DiagnosisRecord[];
};

const GARAGE_KEY = 'spotonauto-garage-v1';

function loadStore(): GarageStore {
  return readLocalJson<GarageStore>(GARAGE_KEY, { vehicles: [], diagnoses: [] });
}

function saveStore(store: GarageStore): void {
  writeLocalJson(GARAGE_KEY, store);
}

function requireUserId(): string | null {
  const user = loadLocalUser();
  return user?.id ?? null;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

class GarageService {
  async getGarage(userId: string): Promise<GarageVehicle[]> {
    if (!hasLocalStorage()) return [];
    return loadStore().vehicles.filter((vehicle) => vehicle.user_id === userId);
  }

  async addVehicle(
    userId: string,
    vehicle: Omit<GarageVehicle, 'id' | 'user_id' | 'created_at'>
  ): Promise<GarageVehicle> {
    const store = loadStore();
    const record: GarageVehicle = {
      id: createId('veh'),
      user_id: userId,
      created_at: new Date().toISOString(),
      ...vehicle,
    };
    store.vehicles = [record, ...store.vehicles.filter((item) => !(item.user_id === userId && item.id === record.id))];
    saveStore(store);
    return record;
  }

  async updateVehicle(
    vehicleId: string,
    updates: Partial<Omit<GarageVehicle, 'id' | 'user_id'>>
  ): Promise<GarageVehicle> {
    const store = loadStore();
    const index = store.vehicles.findIndex((item) => item.id === vehicleId);
    if (index === -1) {
      throw new Error('Vehicle not found');
    }
    const next: GarageVehicle = {
      ...store.vehicles[index],
      ...updates,
    };
    store.vehicles[index] = next;
    saveStore(store);
    return next;
  }

  async removeVehicle(vehicleId: string): Promise<void> {
    const store = loadStore();
    store.vehicles = store.vehicles.filter((item) => item.id !== vehicleId);
    saveStore(store);
  }

  async saveDiagnosis(
    userId: string,
    diagnosis: Omit<DiagnosisRecord, 'id' | 'user_id' | 'created_at'>
  ): Promise<DiagnosisRecord> {
    const store = loadStore();
    const record: DiagnosisRecord = {
      id: createId('diag'),
      user_id: userId,
      created_at: new Date().toISOString(),
      ...diagnosis,
    };
    store.diagnoses = [record, ...store.diagnoses.filter((item) => item.id !== record.id)];
    saveStore(store);
    return record;
  }

  async getDiagnosisHistory(userId: string): Promise<DiagnosisRecord[]> {
    if (!hasLocalStorage()) return [];
    return loadStore().diagnoses
      .filter((item) => item.user_id === userId)
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
  }

  async getDiagnosis(diagnosisId: string): Promise<DiagnosisRecord | null> {
    if (!hasLocalStorage()) return null;
    return loadStore().diagnoses.find((item) => item.id === diagnosisId) ?? null;
  }

  async updateDiagnosisStatus(
    diagnosisId: string,
    status: 'active' | 'resolved' | 'archived'
  ): Promise<void> {
    const store = loadStore();
    const index = store.diagnoses.findIndex((item) => item.id === diagnosisId);
    if (index === -1) throw new Error('Diagnosis not found');
    store.diagnoses[index] = {
      ...store.diagnoses[index],
      status,
    };
    saveStore(store);
  }

  async getGarageStats(userId: string): Promise<{
    vehicleCount: number;
    totalDiagnoses: number;
    activeIssues: number;
    resolvedIssues: number;
  }> {
    const store = loadStore();
    const vehicles = store.vehicles.filter((item) => item.user_id === userId);
    const diagnoses = store.diagnoses.filter((item) => item.user_id === userId);
    return {
      vehicleCount: vehicles.length,
      totalDiagnoses: diagnoses.length,
      activeIssues: diagnoses.filter((item) => item.status === 'active').length,
      resolvedIssues: diagnoses.filter((item) => item.status === 'resolved').length,
    };
  }
}

export const garageService = new GarageService();

export function getCurrentUserGarageId(): string | null {
  return requireUserId();
}
