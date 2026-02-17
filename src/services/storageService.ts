
import { RepairGuide, HistoryItem } from '../types';
import { supabase } from '../lib/supabaseClient';

export const getHistory = async (): Promise<HistoryItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('guides')
    .select('id, vehicle_json, guide_content_json, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  // Map to HistoryItem
  return data.map((row) => {
    // vehicle_json and guide_content_json are stored as JSONB, so they come back as objects
    const vehicle = row.vehicle_json;
    const guide = row.guide_content_json;

    return {
      id: row.id,
      title: guide.title || 'Untitled Repair',
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      timestamp: new Date(row.created_at).getTime(),
    };
  });
};

export const saveGuide = async (guide: RepairGuide): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('User not logged in, cannot save guide to cloud.');
    return;
  }

  const { error } = await supabase
    .from('guides')
    .insert({
      user_id: user.id,
      vehicle_json: guide.vehicle, // Assuming guide.vehicle is the object
      guide_content_json: guide,   // Store full guide
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
    .from('guides')
    .select('guide_content_json')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return data.guide_content_json as RepairGuide;
};
