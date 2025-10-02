-- Ensure signup creates profile + (if lecturer) qualifications
-- Safe re-creation of trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Optional: helpful indexes for frequent lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_qual_user_id ON public.lecturer_qualifications(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON public.complaints(student_id);