/**
 * Garage Service - Manages user's saved vehicles
 */

import { supabase } from './storageService';

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

class GarageService {
  /**
   * Get all vehicles in user's garage
   */
  async getGarage(userId: string): Promise<GarageVehicle[]> {
    const { data, error } = await supabase
      .from('garage_vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching garage:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Add a vehicle to garage
   */
  async addVehicle(
    userId: string,
    vehicle: Omit<GarageVehicle, 'id' | 'user_id' | 'created_at'>
  ): Promise<GarageVehicle> {
    const { data, error } = await supabase
      .from('garage_vehicles')
      .insert({
        user_id: userId,
        ...vehicle
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update a vehicle
   */
  async updateVehicle(
    vehicleId: string,
    updates: Partial<Omit<GarageVehicle, 'id' | 'user_id'>>
  ): Promise<GarageVehicle> {
    const { data, error } = await supabase
      .from('garage_vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }

    return data;
  }

  /**
   * Remove a vehicle from garage
   */
  async removeVehicle(vehicleId: string): Promise<void> {
    const { error } = await supabase
      .from('garage_vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) {
      console.error('Error removing vehicle:', error);
      throw error;
    }
  }

  /**
   * Save a diagnosis to history
   */
  async saveDiagnosis(
    userId: string,
    diagnosis: Omit<DiagnosisRecord, 'id' | 'user_id' | 'created_at'>
  ): Promise<DiagnosisRecord> {
    const { data, error } = await supabase
      .from('diagnosis_history')
      .insert({
        user_id: userId,
        ...diagnosis
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving diagnosis:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get user's diagnosis history
   */
  async getDiagnosisHistory(userId: string): Promise<DiagnosisRecord[]> {
    const { data, error } = await supabase
      .from('diagnosis_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching diagnosis history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a single diagnosis
   */
  async getDiagnosis(diagnosisId: string): Promise<DiagnosisRecord | null> {
    const { data, error } = await supabase
      .from('diagnosis_history')
      .select('*')
      .eq('id', diagnosisId)
      .single();

    if (error) {
      console.error('Error fetching diagnosis:', error);
      return null;
    }

    return data;
  }

  /**
   * Update diagnosis status
   */
  async updateDiagnosisStatus(
    diagnosisId: string,
    status: 'active' | 'resolved' | 'archived'
  ): Promise<void> {
    const { error } = await supabase
      .from('diagnosis_history')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', diagnosisId);

    if (error) {
      console.error('Error updating diagnosis:', error);
      throw error;
    }
  }

  /**
   * Get garage stats for a user
   */
  async getGarageStats(userId: string): Promise<{
    vehicleCount: number;
    totalDiagnoses: number;
    activeIssues: number;
    resolvedIssues: number;
  }> {
    const [{ count: vehicleCount }, { count: totalDiagnoses }, { count: activeIssues }, { count: resolvedIssues }] = await Promise.all([
      supabase.from('garage_vehicles').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('diagnosis_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('diagnosis_history').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
      supabase.from('diagnosis_history').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'resolved')
    ]);

    return {
      vehicleCount: vehicleCount || 0,
      totalDiagnoses: totalDiagnoses || 0,
      activeIssues: activeIssues || 0,
      resolvedIssues: resolvedIssues || 0
    };
  }
}

export const garageService = new GarageService();
