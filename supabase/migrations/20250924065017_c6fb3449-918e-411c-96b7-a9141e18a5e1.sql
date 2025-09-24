-- Promote adamsabubakr74@gmail.com to admin
UPDATE profiles 
SET user_type = 'admin', status = 'active' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'adamsabubakr74@gmail.com'
);