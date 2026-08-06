-- Week-scoped sprints: Mon–Sat bounds for dashboard demands
ALTER TABLE public.sprints
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

CREATE UNIQUE INDEX IF NOT EXISTS sprints_client_week_uidx
  ON public.sprints (client_id, start_date, end_date)
  WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

COMMENT ON COLUMN public.sprints.start_date IS 'Work-week Monday (inclusive)';
COMMENT ON COLUMN public.sprints.end_date IS 'Work-week Saturday (inclusive)';
