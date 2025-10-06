BEGIN;

-- Fix infinite recursion by removing profile-dependent checks in other tables

-- exam_attempts: replace admin policy to use has_role
DROP POLICY IF EXISTS "Admins can view all exam attempts" ON public.exam_attempts;
CREATE POLICY "Admins can view all exam attempts"
ON public.exam_attempts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- exams: replace admin policy to use has_role
DROP POLICY IF EXISTS "Admins can view all exams" ON public.exams;
CREATE POLICY "Admins can view all exams"
ON public.exams
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- complaints: replace admin/lecturer policy to use has_role
DROP POLICY IF EXISTS "Admins and lecturers can view all complaints" ON public.complaints;
CREATE POLICY "Admins and lecturers can view all complaints"
ON public.complaints
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'lecturer')
);

-- complaint_responses: replace admin/lecturer ALL policy to use has_role
DROP POLICY IF EXISTS "Admins and lecturers can manage responses" ON public.complaint_responses;
CREATE POLICY "Admins and lecturers can manage responses"
ON public.complaint_responses
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'lecturer')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'lecturer')
);

COMMIT;