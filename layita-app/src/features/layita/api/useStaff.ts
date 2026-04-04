// src/features/settings/api/useStaff.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../auth/supabaseClient';

const fetchStaff = async () => {
  const { data, error } = await supabase
    .from('layita_staff')
    .select('id, name, role')
    .order('name');

  if (error) throw new Error(error.message);
  return data;
};

export function useStaff() {
  return useQuery({
    queryKey: ['reference-data', 'staff'],
    queryFn: fetchStaff,
    staleTime: 1000 * 60 * 60 * 24, 
  });
}