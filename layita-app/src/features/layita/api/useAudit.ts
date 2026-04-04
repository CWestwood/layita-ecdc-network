import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../auth/supabaseClient';

export interface AuditRow {
  id:               string;
  table_name:       string;
  record_id:        string;
  field_name:       string;
  old_val:          string | null;
  new_val:          string | null;
  changed_by_name:  string | null;
  changed_at:       string; // ISO string
  record_name?:     string | null;
}

interface UseAuditLogsParams {
  recordId:  string;
  tableName: string;
}

export const useAuditLogs = ({ recordId, tableName }: UseAuditLogsParams) => {
  return useQuery<AuditRow[]>({
    queryKey: ['audit_logs', tableName, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('human_audit_logs')
        .select('id, table_name, record_id, record_name, field_name, old_val, new_val, changed_by_name, changed_at')
        .eq('record_id', recordId)
        .eq('table_name', tableName)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!recordId && !!tableName,
  });
};

export const useAllAuditLogs = () => {
  return useQuery<AuditRow[]>({
    queryKey: ['audit_logs_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('human_audit_logs')
        .select('id, table_name, record_id, record_name, field_name, old_val, new_val, changed_by_name, changed_at')
        .order('changed_at', { ascending: false })
        .limit(1000); // Load up to 1000 of the most recent events

      if (error) throw error;
      return data ?? [];
    }
  });
};