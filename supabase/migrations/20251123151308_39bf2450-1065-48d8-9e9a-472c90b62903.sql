-- Create exam violations tracking table
CREATE TABLE IF NOT EXISTS public.exam_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL,
  violation_type TEXT NOT NULL,
  violation_count INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details TEXT,
  CONSTRAINT fk_exam_violations_attempt FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.exam_violations ENABLE ROW LEVEL SECURITY;

-- Students can view their own violations
CREATE POLICY "Students can view their own violations"
ON public.exam_violations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exam_attempts
    WHERE exam_attempts.id = exam_violations.attempt_id
    AND exam_attempts.student_id = auth.uid()
  )
);

-- Students can insert violations for their attempts
CREATE POLICY "Students can insert violations for their attempts"
ON public.exam_violations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.exam_attempts
    WHERE exam_attempts.id = exam_violations.attempt_id
    AND exam_attempts.student_id = auth.uid()
  )
);

-- Lecturers can view violations for their exam attempts
CREATE POLICY "Lecturers can view violations for their exams"
ON public.exam_violations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.exam_attempts ea
    JOIN public.exams e ON e.id = ea.exam_id
    WHERE ea.id = exam_violations.attempt_id
    AND e.lecturer_id = auth.uid()
  )
);

-- Admins can view all violations
CREATE POLICY "Admins can view all violations"
ON public.exam_violations
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_exam_violations_attempt_id ON public.exam_violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_exam_violations_type ON public.exam_violations(violation_type);