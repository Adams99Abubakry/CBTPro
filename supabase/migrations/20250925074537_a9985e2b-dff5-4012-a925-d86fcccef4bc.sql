-- Add email to profiles to display and contact users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update the signup handler to also capture email and ensure lecturer profiles are pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  -- Always create profile with email
  INSERT INTO public.profiles (user_id, first_name, last_name, user_type, status, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'user_type',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'lecturer' THEN 'pending'
      ELSE 'active'
    END,
    NEW.email
  );

  -- If lecturer, also create a qualifications record using metadata from sign up
  IF NEW.raw_user_meta_data->>'user_type' = 'lecturer' THEN
    INSERT INTO public.lecturer_qualifications (
      user_id,
      institution,
      degree,
      field_of_study,
      graduation_year,
      experience_years,
      additional_qualifications
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'institution', 'Unknown Institution'),
      COALESCE(NEW.raw_user_meta_data->>'degree', 'unspecified'),
      COALESCE(NEW.raw_user_meta_data->>'field_of_study', 'unspecified'),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'graduation_year','')::int, EXTRACT(YEAR FROM now())::int),
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'experience_years','')::int, 0),
      COALESCE(NEW.raw_user_meta_data->>'additional_qualifications', '')
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists to create profiles/qualifications on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS: Allow admins to see and manage all profiles (keep existing user-specific policies)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- RLS: Allow admins to view all exams (for counts/analytics)
CREATE POLICY "Admins can view all exams"
ON public.exams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- RLS: Allow admins to view all exam attempts (for analytics)
CREATE POLICY "Admins can view all exam attempts"
ON public.exam_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.user_type = 'admin'
  )
);

-- Relationship to support nested selects from profiles -> lecturer_qualifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_lecturer_qualifications_profiles_user'
  ) THEN
    ALTER TABLE public.lecturer_qualifications
    ADD CONSTRAINT fk_lecturer_qualifications_profiles_user
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(user_id)
    ON DELETE CASCADE;
  END IF;
END$$;