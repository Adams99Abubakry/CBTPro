-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true);

-- Create course_materials table
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('note', 'video', 'document')),
  file_name TEXT NOT NULL,
  lecturer_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_materials
CREATE POLICY "Lecturers can manage their own materials"
ON public.course_materials
FOR ALL
USING (auth.uid() = lecturer_id);

CREATE POLICY "Students can view all materials"
ON public.course_materials
FOR SELECT
USING (true);

CREATE POLICY "Admins can view all materials"
ON public.course_materials
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Storage policies for course-materials bucket
CREATE POLICY "Lecturers can upload course materials"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-materials' AND
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'lecturer'))
);

CREATE POLICY "Anyone can view course materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-materials');

CREATE POLICY "Lecturers can update their own materials"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-materials' AND
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'lecturer'))
);

CREATE POLICY "Lecturers can delete their own materials"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-materials' AND
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND user_type = 'lecturer'))
);

-- Trigger for updated_at
CREATE TRIGGER update_course_materials_updated_at
BEFORE UPDATE ON public.course_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();