BEGIN;

-- Clean up existing profiles policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Lecturers can view profiles of their exam participants" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Single SELECT policy that ORs all allowed cases
CREATE POLICY "Profiles select access"
  ON public.profiles
  FOR SELECT
  USING (
    (auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.student_id = profiles.user_id
        AND e.lecturer_id = auth.uid()
    )
  );

-- Single UPDATE policy allowing user or admin to update
CREATE POLICY "Profiles update access"
  ON public.profiles
  FOR UPDATE
  USING (
    (auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin')
  );

-- INSERT policy: users can create their own profile
CREATE POLICY "Profiles insert access"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMIT;