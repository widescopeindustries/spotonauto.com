
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

/**
 * Get a guide by its slug ID (e.g., "2020-toyota-camry-brake-pads")
 * Parses the slug to search by vehicle fields + problem title
 */
export const getGuideById = async (slugId: string): Promise<RepairGuide | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Parse slug: year-make-model-task (task may have multiple words)
  const parts = slugId.split('-');
  if (parts.length < 4) return null;

  const vehicleYear = parts[0];
  const vehicleMake = parts[1];
  // Model could be single word or multiple (e.g., "grand-cherokee")
  // Task is typically the last segment(s) - we'll search by prefix match
  const vehicleModel = parts[2];
  const taskSlug = parts.slice(3).join(' '); // "brake pads" from "brake-pads"

  const { data, error } = await supabase
    .from('diagnosis_history')
    .select('conversation')
    .eq('user_id', user.id)
    .eq('vehicle_year', vehicleYear)
    .ilike('vehicle_make', vehicleMake)
    .ilike('vehicle_model', `${vehicleModel}%`)
    .ilike('problem', `%${taskSlug}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return data.conversation as RepairGuide;
};
