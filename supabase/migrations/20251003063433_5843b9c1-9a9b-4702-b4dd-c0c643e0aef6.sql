-- 1) Backfill admin roles so admins can see all profiles per RLS
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'
FROM public.profiles p
LEFT JOIN public.user_roles ur 
  ON ur.user_id = p.user_id AND ur.role = 'admin'
WHERE p.user_type = 'admin' AND ur.user_id IS NULL;

-- 2) Keep user_roles in sync with profiles.user_type for admins
CREATE OR REPLACE FUNCTION public.sync_admin_role_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Ensure non-admins do not retain the admin role
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_admin_role_insert ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_admin_role_update ON public.profiles;
CREATE TRIGGER trg_sync_admin_role_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_role_from_profiles();

CREATE TRIGGER trg_sync_admin_role_update
AFTER UPDATE OF user_type ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_admin_role_from_profiles();

-- 3) Clear all complaints as requested (responses first to respect FK ordering)
DELETE FROM public.complaint_responses;
DELETE FROM public.complaints;