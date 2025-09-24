-- Update handle_new_user to also create lecturer qualifications from sign-up metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always create profile
  INSERT INTO public.profiles (user_id, first_name, last_name, user_type, status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'user_type',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'lecturer' THEN 'pending'
      ELSE 'active'
    END
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
$$;