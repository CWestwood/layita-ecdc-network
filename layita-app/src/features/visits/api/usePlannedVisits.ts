import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../auth/supabaseClient';

export interface PlanningRow {
  id: string | null;
  scheduled_date: string | null;
  practitioner_name: string | null;
  outreach_type: string | null;
  status: string | null;
  assigned_to: { name: string } | null;
  updated_at: string | null;
}

const fetchPlannedVisits = async (): Promise<PlanningRow[]> => {
  const { data, error } = await supabase
    .from('planned_visits')
    .select(`
      id, scheduled_date, practitioner_name, outreach_type, status, assigned_to: layita_staff (name), updated_at
    `)
    .order('scheduled_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PlanningRow[];
};

export function usePlannedVisits() {
  return useQuery({
    queryKey: ['planned_visits'], 
    queryFn: fetchPlannedVisits,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}