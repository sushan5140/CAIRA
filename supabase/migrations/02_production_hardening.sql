-- ==============================================================================
-- CAIRA production hardening
-- - persist interview length
-- - make RLS ownership checks explicit for authenticated users
-- - keep storage objects inside the authenticated user's folder
-- - lock down the auth trigger helper
-- ==============================================================================

alter table public.interviews
  add column if not exists target_questions int not null default 5
  check (target_questions between 5 and 10);

-- Supabase projects created in 2026 may not auto-expose new public tables to the
-- Data API. Grant only the operations CAIRA needs; RLS remains the row-level gate.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.interviews to authenticated;
grant select, insert, update on public.interview_questions to authenticated;

-- Profiles --------------------------------------------------------------------
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Interviews ------------------------------------------------------------------
drop policy if exists "Users can view own interviews" on public.interviews;
create policy "Users can view own interviews"
  on public.interviews for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own interviews" on public.interviews;
create policy "Users can create own interviews"
  on public.interviews for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own interviews" on public.interviews;
create policy "Users can update own interviews"
  on public.interviews for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own interviews" on public.interviews;
create policy "Users can delete own interviews"
  on public.interviews for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Interview questions ----------------------------------------------------------
drop policy if exists "Users can view questions for own interviews" on public.interview_questions;
create policy "Users can view questions for own interviews"
  on public.interview_questions for select
  to authenticated
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_questions.interview_id
        and interviews.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can insert questions for own interviews" on public.interview_questions;
create policy "Users can insert questions for own interviews"
  on public.interview_questions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_questions.interview_id
        and interviews.user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can update questions for own interviews" on public.interview_questions;
create policy "Users can update questions for own interviews"
  on public.interview_questions for update
  to authenticated
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_questions.interview_id
        and interviews.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_questions.interview_id
        and interviews.user_id = (select auth.uid())
    )
  );

-- Auth profile trigger ----------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- Storage ----------------------------------------------------------------------
-- CAIRA writes files as <auth.uid()>/<generated-name>. We intentionally use
-- upsert=false in the API, so INSERT + SELECT are sufficient.
drop policy if exists "Authenticated users can upload resumes to their folder" on storage.objects;
create policy "Authenticated users can upload resumes to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can read own resumes" on storage.objects;
create policy "Users can read own resumes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Authenticated users can upload job-descriptions to their folder" on storage.objects;
create policy "Authenticated users can upload job-descriptions to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'job-descriptions'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users can read own job-descriptions" on storage.objects;
create policy "Users can read own job-descriptions"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'job-descriptions'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
