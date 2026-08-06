-- Enable Supabase Realtime for tasks so assignee dashboards refresh promptly.
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
