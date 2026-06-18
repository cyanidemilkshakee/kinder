-- Campus Dating App Schema (Consolidated & Idempotent)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,20}$'),
  has_password boolean default false not null,
  real_name text not null,
  department text not null,
  year text not null,
  gender text not null,
  bio text,
  relationship_intent text not null,
  date_of_birth date,
  is_visible boolean default true,
  deletion_queued_at timestamp with time zone,
  avatar_url text,
  photos text[] default '{}'::text[],
  role text default 'user',
  ban_expires_at timestamp with time zone,
  is_suspended boolean default false,
  interest_tags text[],
  food_preference text default 'No preference',
  drinking_habit text default 'Prefer not to say',
  smoking_habit text default 'Prefer not to say',
  interested_interests text[] default '{}'::text[],
  interested_departments text[] default '{}'::text[],
  interested_years text[] default '{}'::text[],
  super_likes_today int default 0,
  super_likes_reset_at timestamp with time zone default now(),
  relationship_intents text[] default array['friendship'::text],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SWIPES
create table if not exists public.swipes (
  id uuid default uuid_generate_v4() primary key,
  swiper_id uuid references public.profiles on delete cascade not null,
  swiped_id uuid references public.profiles on delete cascade not null,
  is_right_swipe boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(swiper_id, swiped_id)
);

-- MATCHES
create table if not exists public.matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles on delete cascade not null,
  user2_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user1_id, user2_id)
);

-- MESSAGES
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONFESSIONS
create table if not exists public.confessions (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles on delete cascade not null,
  receiver_id uuid references public.profiles on delete cascade,
  receiver_username text check (receiver_username is null or receiver_username ~ '^[a-z0-9_]{3,20}$'),
  receiver_email text not null,
  content text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_revealed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REPORTS
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles on delete set null,
  reported_id uuid references public.profiles on delete cascade not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'action_taken')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUPER LIKES
create table if not exists public.super_likes (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles on delete cascade not null,
  receiver_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique (sender_id, receiver_id)
);

-- BLOCKS
create table if not exists public.blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references public.profiles on delete cascade not null,
  blocked_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique (blocker_id, blocked_id)
);

-- SUPPORT MESSAGES
create table if not exists public.support_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete set null,
  name text,
  message text not null,
  type text default 'contact' check (type in ('contact', 'bug')),
  created_at timestamp with time zone default now() not null
);


-- ADD MISSING COLUMNS (Additive Migration for existing tables)
alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists role text default 'user',
  add column if not exists ban_expires_at timestamp with time zone,
  add column if not exists is_suspended boolean default false,
  add column if not exists interest_tags text[],
  add column if not exists food_preference text default 'No preference',
  add column if not exists drinking_habit text default 'Prefer not to say',
  add column if not exists smoking_habit text default 'Prefer not to say',
  add column if not exists interested_interests text[] default '{}'::text[],
  add column if not exists interested_departments text[] default '{}'::text[],
  add column if not exists interested_years text[] default '{}'::text[],
  add column if not exists super_likes_today int default 0,
  add column if not exists super_likes_reset_at timestamp with time zone default now(),
  add column if not exists relationship_intents text[] default array['friendship'::text],
  add column if not exists username text,
  add column if not exists has_password boolean default false not null;

alter table public.profiles
  drop column if exists hookup_opt_in,
  drop column if exists hookup_opt_in_changed_at;

update public.profiles
set relationship_intent = 'friendship'
where relationship_intent = 'casual';

update public.profiles
set relationship_intents = coalesce(
  nullif(array_remove(relationship_intents, 'casual'), '{}'::text[]),
  array['friendship'::text]
);

alter table public.confessions
  add column if not exists is_revealed boolean default false,
  add column if not exists receiver_id uuid references public.profiles on delete cascade,
  add column if not exists receiver_username text;

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.confessions enable row level security;
alter table public.reports enable row level security;
alter table public.super_likes enable row level security;
alter table public.blocks enable row level security;
alter table public.support_messages enable row level security;

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Swipes Policies
drop policy if exists "Users can view their own swipes" on swipes;
create policy "Users can view their own swipes" on swipes for select using (auth.uid() = swiper_id or auth.uid() = swiped_id);

drop policy if exists "Users can insert their own swipes" on swipes;
create policy "Users can insert their own swipes" on swipes for insert with check (auth.uid() = swiper_id);

-- Matches Policies
drop policy if exists "Users can view their own matches" on matches;
create policy "Users can view their own matches" on matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "Users can insert matches" on matches;
create policy "Users can insert matches" on matches for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Messages Policies
drop policy if exists "Users can view messages of their matches" on messages;
create policy "Users can view messages of their matches" on messages for select using (
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

drop policy if exists "Users can insert messages to their matches" on messages;
create policy "Users can insert messages to their matches" on messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

drop policy if exists "Users can update messages of their matches" on messages;
create policy "Users can update messages of their matches" on messages for update using (
  auth.uid() != sender_id and
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

-- Confessions Policies
drop policy if exists "Users can view own or approved confessions" on confessions;
create policy "Users can view own or approved confessions" on confessions for select using (
  sender_id = auth.uid() or
  (
    status = 'approved'
    and (
      receiver_id = auth.uid()
      or receiver_email = (select email from profiles where id = auth.uid())
      or receiver_username = (select username from profiles where id = auth.uid())
    )
  )
);

drop policy if exists "Users can insert their own confessions" on confessions;
create policy "Users can insert their own confessions" on confessions for insert with check (auth.uid() = sender_id);

drop policy if exists "Users can update their received confessions" on confessions;
create policy "Users can update their received confessions" on confessions for update using (
    receiver_id = auth.uid()
    or receiver_email = (select email from profiles where id = auth.uid())
    or receiver_username = (select username from profiles where id = auth.uid())
) with check (
    receiver_id = auth.uid()
    or receiver_email = (select email from profiles where id = auth.uid())
    or receiver_username = (select username from profiles where id = auth.uid())
);

-- Reports Policies
drop policy if exists "Users can view their own reports" on reports;
create policy "Users can view their own reports" on reports for select using (reporter_id = auth.uid());

drop policy if exists "Users can insert reports" on reports;
create policy "Users can insert reports" on reports for insert with check (reporter_id = auth.uid());

-- Super Likes Policies
drop policy if exists "Users can view super likes they sent" on super_likes;
create policy "Users can view super likes they sent" on super_likes for select using (auth.uid() = sender_id);

drop policy if exists "Users can view super likes they received" on super_likes;
create policy "Users can view super likes they received" on super_likes for select using (auth.uid() = receiver_id);

drop policy if exists "Users can insert their own super likes" on super_likes;
create policy "Users can insert their own super likes" on super_likes for insert with check (auth.uid() = sender_id);

-- Blocks Policies
drop policy if exists "Users can view blocks they created" on blocks;
create policy "Users can view blocks they created" on blocks for select using (auth.uid() = blocker_id);

drop policy if exists "Users can insert their own blocks" on blocks;
create policy "Users can insert their own blocks" on blocks for insert with check (auth.uid() = blocker_id);

drop policy if exists "Users can delete their own blocks" on blocks;
create policy "Users can delete their own blocks" on blocks for delete using (auth.uid() = blocker_id);

-- Support Messages Policies
drop policy if exists "Users can insert their own support messages" on support_messages;
create policy "Users can insert their own support messages" on support_messages for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can view their own support messages" on support_messages;
create policy "Users can view their own support messages" on support_messages for select using (auth.uid() = user_id);


-- TRIGGERS & FUNCTIONS

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  selected_intent text;
begin
  selected_intent := case
    when coalesce(new.raw_user_meta_data->>'relationship_intent', 'friendship') = 'dating' then 'dating'
    else 'friendship'
  end;

  insert into public.profiles (id, email, username, has_password, real_name, department, year, gender, relationship_intent, relationship_intents)
  values (
    new.id, 
    new.email,
    nullif(
      lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', ''), '[^a-z0-9_]', '_', 'g')),
      ''
    ),
    coalesce((new.raw_user_meta_data->>'has_password')::boolean, false),
    coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'real_name', '')),
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'year', ''),
    coalesce(new.raw_user_meta_data->>'gender', ''),
    selected_intent,
    array[selected_intent]
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to enforce email domain
create or replace function public.validate_user_email()
returns trigger as $$
begin
  if (
    lower(new.email) not like '%@bmsce.ac.in' and 
    lower(new.email) != 'ghostfaked02@gmail.com' and 
    lower(new.email) != 'ghostfaked03@gmail.com'
  ) then
    raise exception 'Unauthorized email domain. Only @bmsce.ac.in is allowed.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists ensure_valid_email on auth.users;
create trigger ensure_valid_email
  before insert on auth.users
  for each row execute procedure public.validate_user_email();

-- Moderation report threshold trigger
create or replace function public.handle_report_thresholds()
returns trigger as $$
declare
  report_count int;
begin
  select count(*) into report_count
  from public.reports
  where reported_id = new.reported_id
    and status != 'action_taken';

  -- 3 reports -> 7-day restriction
  if report_count = 3 then
    update public.profiles
      set ban_expires_at = now() + interval '7 days'
      where id = new.reported_id;
  end if;

  -- 5+ reports -> permanent suspension (manual review to lift)
  if report_count >= 5 then
    update public.profiles
      set is_suspended = true,
      ban_expires_at = null
      where id = new.reported_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists evaluate_report_thresholds on public.reports;
create trigger evaluate_report_thresholds
  after insert on public.reports
  for each row execute procedure public.handle_report_thresholds();
