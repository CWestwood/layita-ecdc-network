-- Create the materialized view
CREATE MATERIALIZED VIEW public.practitioner_outreach_summary AS
SELECT 
    DATE_TRUNC('month', ov.date)::DATE AS visit_month,
    p.id AS practitioner_id,
    p.name AS practitioner_name,
    e.id AS ecdc_id,
    e.name AS ecdc_name,
    a.id AS area_id,
    a.name AS area_name,
    COUNT(ov.id) FILTER (WHERE ov.outreach_type IN ('Practitioner Support', 'Caregiver Training', 'Literacy Promotion')) AS total_visits,
    SUM(COALESCE(ov.parents_trained, 0)) AS total_parents_trained,
    SUM(COALESCE(ov.children_books, 0)) AS total_children_books,
    SUM(COALESCE(ov.transport_cost, 0)) AS total_transport_cost,
    SUM(COALESCE(ov.transport_km, 0)) AS total_transport_km
FROM public.outreach_visits ov
JOIN public.practitioners p ON ov.practitioner_id = p.id
LEFT JOIN public.ecdc_list e ON p.ecdc_id = e.id
LEFT JOIN public.area a ON e.area_id = a.id
WHERE ov.date IS NOT NULL
GROUP BY 
    DATE_TRUNC('month', ov.date),
    p.id,
    p.name,
    e.id,
    e.name,
    a.id,
    a.name;

-- Create a unique index (CRITICAL for concurrent refreshing)
CREATE UNIQUE INDEX idx_practitioner_outreach_summary_unique 
ON public.practitioner_outreach_summary (visit_month, practitioner_id);

-- Set permissions
GRANT SELECT ON public.practitioner_outreach_summary TO authenticated;
GRANT SELECT ON public.practitioner_outreach_summary TO service_role;

CREATE MATERIALIZED VIEW public.practitioner_target_tracking AS
WITH current_year_visits AS (
    SELECT 
        practitioner_id,
        COUNT(id) AS visits_ytd
    FROM public.outreach_visits
    -- Only count visits from the current year
    WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY practitioner_id
)
SELECT 
    p.id AS practitioner_id,
    p.name AS practitioner_name,
    e.name AS ecdc_name,
    a.name AS area_name,
    COALESCE(cyv.visits_ytd, 0) AS visits_ytd,
    COALESCE(vr.minimum_visits_per_year, 1) AS target_visits,
    -- Boolean flag for the frontend to easily highlight who needs a visit
    (COALESCE(cyv.visits_ytd, 0) >= COALESCE(vr.minimum_visits_per_year, 1)) AS target_met,
    -- Calculate how many visits are remaining
    GREATEST(COALESCE(vr.minimum_visits_per_year, 1) - COALESCE(cyv.visits_ytd, 0), 0) AS visits_remaining
FROM public.practitioners p
LEFT JOIN public.ecdc_list e ON p.ecdc_id = e.id
LEFT JOIN public.area a ON e.area_id = a.id
LEFT JOIN current_year_visits cyv ON p.id = cyv.practitioner_id
-- Join the visit requirements based on the area
LEFT JOIN public.visit_requirements vr ON a.id = vr.area_id;

-- Create a unique index
CREATE UNIQUE INDEX idx_practitioner_target_tracking_unique 
ON public.practitioner_target_tracking (practitioner_id);

-- Set permissions
GRANT SELECT ON public.practitioner_target_tracking TO authenticated;
GRANT SELECT ON public.practitioner_target_tracking TO service_role;

CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- CONCURRENTLY allows the view to be read by the frontend while it's updating
    -- It requires the UNIQUE INDEX created above to work.
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.practitioner_outreach_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.practitioner_target_tracking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_dashboard_views() TO authenticated;