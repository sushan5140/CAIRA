-- ==============================================================================
-- CAIRA: Supabase Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Profiles Table (References auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  created_at timestamptz default now()
);

-- 2. Interviews Table
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  job_role text not null,
  resume_path text,
  jd_path text,
  jd_text text,
  extracted_skills jsonb,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  overall_score int,
  report jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- 3. Interview Questions Table
create table if not exists public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references public.interviews on delete cascade not null,
  question_number int not null,
  question_text text not null,
  question_type text default 'technical',
  targets_skill text,
  answer_text text,
  answer_audio_path text,
  score int,
  evaluation jsonb,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_questions enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Interviews Policies
create policy "Users can view own interviews"
  on public.interviews for select
  using (auth.uid() = user_id);

create policy "Users can create own interviews"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own interviews"
  on public.interviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own interviews"
  on public.interviews for delete
  using (auth.uid() = user_id);

-- Interview Questions Policies (Linked to interviews.user_id)
create policy "Users can view questions for own interviews"
  on public.interview_questions for select
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_questions.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can insert questions for own interviews"
  on public.interview_questions for insert
  with check (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_questions.interview_id
      and interviews.user_id = auth.uid()
    )
  );

create policy "Users can update questions for own interviews"
  on public.interview_questions for update
  using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_questions.interview_id
      and interviews.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- PROFILE AUTO-CREATION TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (Private)
-- ==============================================================================
-- Run these via Supabase SQL Editor if buckets do not already exist:
insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('job-descriptions', 'job-descriptions', false)
on conflict (id) do nothing;

-- Storage RLS: Restrict uploads/downloads to authenticated user folders
create policy "Authenticated users can upload resumes to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own resumes"
  on storage.objects for select
  using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Authenticated users can upload job-descriptions to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'job-descriptions' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own job-descriptions"
  on storage.objects for select
  using (
    bucket_id = 'job-descriptions' and auth.uid()::text = (storage.foldername(name))[1]
  );
