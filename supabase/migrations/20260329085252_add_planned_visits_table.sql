CREATE TABLE IF NOT EXISTS "public"."planned_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "practitioner_name" "text" NOT NULL,
    "practitioner_id" "uuid" NOT NULL REFERENCES "public"."practitioners" ("id") ON DELETE RESTRICT,
    "scheduled_date" "date" NOT NULL,
    "outreach_type" "text" NOT NULL,
    "assigned_to" "uuid" NOT NULL REFERENCES "layita_staff" ("id") ON DELETE RESTRICT,
    "status" "text" NOT NULL CHECK (status IN ('planned', 'completed', 'cancelled')),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE MATERIALIZED VIEW public.outreach_summary_stats AS
SELECT 
    DATE_TRUNC('month', ov.date)::DATE AS visit_month,
    a.id AS area_id,
    a.name AS area_name,
    e.id AS ecdc_id,
    e.name AS ecdc_name,
    COUNT(ov.id) FILTER (WHERE ov.outreach_type IN ('Practitioner Support', 'Caregiver Training', 'Literacy Promotion')) AS total_visits,
    SUM(COALESCE(ov.parents_trained, 0)) AS total_parents_trained,
    SUM(COALESCE(ov.children_books, 0)) AS total_children_books,
    SUM(COALESCE(ov.transport_cost, 0)) AS total_transport_cost,
    SUM(COALESCE(ov.transport_km, 0)) AS total_transport_km
FROM public.outreach_visits ov
JOIN public.practitioners p ON ov.practitioner_id = p.id
JOIN public.ecdc_list e ON p.ecdc_id = e.id
JOIN public.area a ON e.area_id = a.id
WHERE ov.date IS NOT NULL
GROUP BY 
    DATE_TRUNC('month', ov.date),
    a.id,
    a.name,
    e.id,
    e.name;

-- Create a unique index (CRITICAL for concurrent refreshing)
CREATE UNIQUE INDEX idx_outreach_summary_unique 
ON public.outreach_summary_stats (visit_month, ecdc_id);

-- Set permissions
GRANT SELECT ON public.outreach_summary_stats TO authenticated;
GRANT SELECT ON public.outreach_summary_stats TO service_role;

CREATE MATERIALIZED VIEW public.ecdc_target_tracking AS
WITH current_year_visits AS (
    SELECT 
        p.ecdc_id,
        COUNT(ov.id) AS visits_ytd
    FROM public.outreach_visits ov
    JOIN public.practitioners p ON ov.practitioner_id = p.id
    -- Only count visits from the current year
    WHERE EXTRACT(YEAR FROM ov.date) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY p.ecdc_id
)
SELECT 
    e.id AS ecdc_id,
    e.name AS ecdc_name,
    a.id AS area_id,
    a.name AS area_name,
    COALESCE(cyv.visits_ytd, 0) AS visits_ytd,
    COALESCE(vr.minimum_visits_per_year, 1) AS target_visits,
    -- Boolean flag for the frontend to easily highlight overdue centers
    (COALESCE(cyv.visits_ytd, 0) >= COALESCE(vr.minimum_visits_per_year, 1)) AS target_met,
    -- Calculate how many visits are remaining
    GREATEST(COALESCE(vr.minimum_visits_per_year, 1) - COALESCE(cyv.visits_ytd, 0), 0) AS visits_remaining
FROM public.ecdc_list e
JOIN public.area a ON e.area_id = a.id
LEFT JOIN current_year_visits cyv ON e.id = cyv.ecdc_id
-- Join the visit requirements based on the area
LEFT JOIN public.visit_requirements vr ON a.id = vr.area_id;

-- Create a unique index
CREATE UNIQUE INDEX idx_ecdc_target_tracking_unique 
ON public.ecdc_target_tracking (ecdc_id);

-- Set permissions
GRANT SELECT ON public.ecdc_target_tracking TO authenticated;
GRANT SELECT ON public.ecdc_target_tracking TO service_role;

CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- CONCURRENTLY allows the view to be read by the frontend while it's updating
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.outreach_summary_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.ecdc_target_tracking;
END;
$$;

-- Allow authenticated users to trigger the refresh
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_views() TO authenticated;

ALTER TABLE public.planned_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow administrators full access to planned visits" ON public.planned_visits
FOR ALL
TO authenticated
USING (public.get_my_role() = 'administrator')
WITH CHECK (public.get_my_role() = 'administrator');

CREATE POLICY "Allow authenticated users to view all planned visits" ON public.planned_visits
FOR SELECT 
TO authenticated
USING (true);