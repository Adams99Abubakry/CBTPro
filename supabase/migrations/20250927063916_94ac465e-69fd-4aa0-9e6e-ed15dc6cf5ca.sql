-- Fix recursive RLS on profiles and add role helper

-- 1) Helper function to check roles without recursive RLS
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- 2) Drop recursive policies on profiles (they referenced profiles within profiles policies)
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;

-- 3) Recreate admin policies using has_role to avoid recursion
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Note: Existing policies allowing users to view/insert/update their own profile remain unchanged.
