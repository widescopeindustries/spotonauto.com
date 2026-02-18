
import { RepairGuide, HistoryItem } from '../types';
import { supabase } from '../lib/supabaseClient';

export const getHistory = async (): Promise<HistoryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('diagnosis_history')
    .select('id, vehicle_year, vehicle_make, vehicle_model, problem, diagnosis_summary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    title: row.problem || row.diagnosis_summary || 'Untitled Repair',
    vehicle: `${row.vehicle_year || ''} ${row.vehicle_make || ''} ${row.vehicle_model || ''}`.trim(),
    timestamp: new Date(row.created_at).getTime(),
  }));
};

export const saveGuide = async (guide: RepairGuide): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('User not logged in, cannot save guide to cloud.');
    return;
  }

  // Parse vehicle info from the guide.vehicle string (e.g., "2020 Toyota Camry")
  const vehicleParts = (guide.vehicle || '').split(' ');
  const vehicleYear = vehicleParts[0] || '';
  const vehicleMake = vehicleParts[1] || '';
  const vehicleModel = vehicleParts.slice(2).join(' ') || '';

  const { error } = await supabase
    .from('diagnosis_history')
    .insert({
      user_id: user.id,
      vehicle_year: vehicleYear,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      problem: guide.title,
      diagnosis_summary: guide.title,
      conversation: guide, // Store full guide as JSONB
      status: 'active',
    });

  if (error) {
    console.error('Error saving guide:', error);
    throw error;
  }
};

export const getGuideById = async (id: string): Promise<RepairGuide | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('diagnosis_history')
    .select('conversation')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  return data.conversation as RepairGuide;
};
