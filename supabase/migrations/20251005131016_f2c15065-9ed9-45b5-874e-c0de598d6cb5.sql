-- Allow lecturers to view profiles of students who attempted their exams
create policy "Lecturers can view profiles of their exam participants"
on public.profiles
for select
using (
  exists (
    select 1
    from public.exam_attempts ea
    join public.exams e on e.id = ea.exam_id
    where ea.student_id = profiles.user_id
      and e.lecturer_id = auth.uid()
  )
);