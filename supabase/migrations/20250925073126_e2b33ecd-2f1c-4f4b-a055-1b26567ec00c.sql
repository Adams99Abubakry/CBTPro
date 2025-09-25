-- Fix the RLS policy for lecturer_qualifications to allow insertion during signup
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert their own qualifications" ON public.lecturer_qualifications;

-- Create a new policy that allows insertion during the signup process
-- This needs to work for both authenticated users and during the signup trigger
CREATE POLICY "Users can insert their own qualifications" 
ON public.lecturer_qualifications 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and owns the record
  (auth.uid() = user_id) 
  OR 
  -- Allow during signup process when user_id matches the user being created
  -- This handles the case where the trigger inserts qualifications
  (user_id IS NOT NULL AND user_id::text = current_setting('request.jwt.claims', true)::json->>'sub')
);

-- Also allow admins to view all lecturer qualifications for approval purposes
CREATE POLICY "Admins can view all lecturer qualifications" 
ON public.lecturer_qualifications 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);