-- Allow collaborators who already work on a client to insert self-assigned tasks
-- (mirrors app assertCanCreateTask). Also allow week-sprint creation for those users.

CREATE OR REPLACE FUNCTION public.works_on_client(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND p_client_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.clients c
        WHERE c.id = p_client_id
          AND c.responsible_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.tasks t
        WHERE t.client_id = p_client_id
          AND t.assignee_id = auth.uid()
      )
    );
$$;

COMMENT ON FUNCTION public.works_on_client(uuid) IS
  'True when auth.uid() is client responsible or already assignee on a task for this client.';

REVOKE ALL ON FUNCTION public.works_on_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.works_on_client(uuid) TO authenticated;

-- tasks INSERT: admins / demand creators, OR self-assign on a client they already work on
DROP POLICY IF EXISTS tasks_insert ON public.tasks;
CREATE POLICY tasks_insert ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_create_demand()
    OR public.is_admin()
    OR (
      assignee_id = auth.uid()
      AND public.works_on_client(client_id)
    )
  );

-- SELECT/UPDATE already allow assignees; DELETE stays admin/can_create_demand only.
-- Recreate SELECT/UPDATE explicitly to keep assignee access aligned with the app.
DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.can_view_screen('dashboard')
    OR public.can_view_screen('clientes')
    OR assignee_id = auth.uid()
  );

DROP POLICY IF EXISTS tasks_update ON public.tasks;
CREATE POLICY tasks_update ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR public.can_create_demand()
    OR assignee_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR public.can_create_demand()
    OR assignee_id = auth.uid()
  );

-- Keep delete locked to demand creators / admins (not assignees).
DROP POLICY IF EXISTS tasks_delete ON public.tasks;
CREATE POLICY tasks_delete ON public.tasks
  FOR DELETE
  TO authenticated
  USING (public.is_admin() OR public.can_create_demand());

-- Sprints: split ALL write policy so assignees who can add tasks may INSERT week sprints.
DROP POLICY IF EXISTS sprints_write ON public.sprints;

CREATE POLICY sprints_insert ON public.sprints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_create_demand()
    OR public.is_admin()
    OR public.works_on_client(client_id)
  );

CREATE POLICY sprints_update ON public.sprints
  FOR UPDATE
  TO authenticated
  USING (public.can_create_demand() OR public.is_admin())
  WITH CHECK (public.can_create_demand() OR public.is_admin());

CREATE POLICY sprints_delete ON public.sprints
  FOR DELETE
  TO authenticated
  USING (public.can_create_demand() OR public.is_admin());
