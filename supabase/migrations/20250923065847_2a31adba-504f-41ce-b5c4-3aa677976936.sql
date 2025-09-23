-- Promote adamsabubakr74@gmail.com to admin
UPDATE profiles 
SET user_type = 'admin', status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'adamsabubakr74@gmail.com'
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  total_marks INTEGER NOT NULL DEFAULT 100,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_questions table
CREATE TABLE public.exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  marks INTEGER NOT NULL DEFAULT 1,
  question_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_attempts table
CREATE TABLE public.exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  total_marks INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_answers table
CREATE TABLE public.exam_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create complaint_responses table
CREATE TABLE public.complaint_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL,
  response_text TEXT NOT NULL,
  is_admin_response BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_responses ENABLE ROW LEVEL SECURITY;

-- Exams policies
CREATE POLICY "Lecturers can manage their own exams" ON public.exams
FOR ALL USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can view published exams" ON public.exams
FOR SELECT USING (status = 'published');

-- Exam questions policies
CREATE POLICY "Lecturers can manage questions for their exams" ON public.exam_questions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.lecturer_id = auth.uid()
  )
);

CREATE POLICY "Students can view questions for published exams" ON public.exam_questions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_questions.exam_id 
    AND exams.status = 'published'
  )
);

-- Exam attempts policies
CREATE POLICY "Students can manage their own attempts" ON public.exam_attempts
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Lecturers can view attempts for their exams" ON public.exam_attempts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = exam_attempts.exam_id 
    AND exams.lecturer_id = auth.uid()
  )
);

-- Exam answers policies
CREATE POLICY "Students can manage answers for their attempts" ON public.exam_answers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.exam_attempts 
    WHERE exam_attempts.id = exam_answers.attempt_id 
    AND exam_attempts.student_id = auth.uid()
  )
);

-- Complaints policies
CREATE POLICY "Students can manage their own complaints" ON public.complaints
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Admins and lecturers can view all complaints" ON public.complaints
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type IN ('admin', 'lecturer')
  )
);

-- Complaint responses policies
CREATE POLICY "Students can view responses to their complaints" ON public.complaint_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaints.id = complaint_responses.complaint_id 
    AND complaints.student_id = auth.uid()
  )
);

CREATE POLICY "Admins and lecturers can manage responses" ON public.complaint_responses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type IN ('admin', 'lecturer')
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();