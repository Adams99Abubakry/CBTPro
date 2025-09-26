-- Ensure profile creation works on signup and backfill missing profiles
-- 1) Recreate trigger to call handle_new_user on new auth.users
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    EXECUTE 'DROP TRIGGER on_auth_user_created ON auth.users';
  END IF;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Ensure a single profile per user
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);

-- 3) Backfill profiles for existing users without one
INSERT INTO public.profiles (user_id, first_name, last_name, user_type, status, email)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'first_name', NULL),
  COALESCE(u.raw_user_meta_data->>'last_name', NULL),
  COALESCE(NULLIF(u.raw_user_meta_data->>'user_type',''),
           CASE WHEN u.email = 'adamsabubakr74@gmail.com' THEN 'admin' ELSE 'student' END),
  CASE 
    WHEN COALESCE(u.raw_user_meta_data->>'user_type','') = 'lecturer' THEN 'pending'
    ELSE 'active'
  END,
  u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- 4) Force admin role for the specified email
UPDATE public.profiles
SET user_type = 'admin', status = 'active'
WHERE email = 'adamsabubakr74@gmail.com';