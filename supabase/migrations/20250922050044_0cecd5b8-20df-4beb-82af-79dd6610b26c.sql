-- Update profiles table to add specific admin user
UPDATE public.profiles 
SET user_type = 'admin', status = 'active'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'adamsabubakr74@gmail.com'
);

-- If profile doesn't exist, we'll handle it in the trigger function
-- Create user_roles table for better role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student', 'lecturer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert admin role for the specific email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users 
WHERE email = 'adamsabubakr74@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;