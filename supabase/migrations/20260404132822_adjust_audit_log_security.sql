
create or replace view public.human_audit_logs as
select
  a.id,
  a.table_name,
  a.record_id,
  p.name        as changed_by_name,
  field.key     as field_name,
  field.value ->> 'old' as old_val,
  field.value ->> 'new' as new_val,
  a.changed_at,
  -- Resolve the record name so the UI doesn't have to join separately
  case a.table_name
    when 'practitioners' then prac.name
    when 'ecdc_list'     then ecdc.name
    else null
  end as record_name
from audit_logs a
left join profiles     p    on a.changed_by_id = p.id
left join practitioners prac on a.table_name = 'practitioners' and a.record_id = prac.id
left join ecdc_list     ecdc on a.table_name = 'ecdc_list'     and a.record_id = ecdc.id,
lateral jsonb_each(a.changed_fields) field(key, value);

create policy "audit_logs: admin/manager read human view"
  on public.audit_logs for select
  to authenticated
  using (public.get_my_role() in ('administrator', 'manager'));

create index if not exists audit_logs_changed_at_idx
  on public.audit_logs (changed_at desc);

create index if not exists audit_logs_changed_by_idx
  on public.audit_logs (changed_by_id);

