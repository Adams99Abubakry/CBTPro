-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (user_id, email, first_name, last_name, user_type, status)
SELECT 
  au.id as user_id,
  au.email,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'student') as user_type,
  CASE 
    WHEN COALESCE(au.raw_user_meta_data->>'user_type', 'student') = 'lecturer' THEN 'pending'
    ELSE 'active'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL;