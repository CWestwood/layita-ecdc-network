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