-- Campus Dating App Schema (OAuth Updated)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  real_name text not null,
  department text not null,
  year text not null,
  gender text not null,
  bio text,
  relationship_intent text not null,
  hookup_opt_in boolean default false,
  is_visible boolean default true,
  deletion_queued_at timestamp with time zone,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SWIPES
create table public.swipes (
  id uuid default uuid_generate_v4() primary key,
  swiper_id uuid references public.profiles on delete cascade not null,
  swiped_id uuid references public.profiles on delete cascade not null,
  is_right_swipe boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(swiper_id, swiped_id)
);

-- MATCHES
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  user1_id uuid references public.profiles on delete cascade not null,
  user2_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user1_id, user2_id)
);

-- MESSAGES
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONFESSIONS
create table public.confessions (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles on delete cascade not null,
  receiver_email text not null,
  content text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REPORTS
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles on delete set null,
  reported_id uuid references public.profiles on delete cascade not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'action_taken')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.confessions enable row level security;
alter table public.reports enable row level security;

create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view their own swipes" on swipes for select using (auth.uid() = swiper_id);
create policy "Users can insert their own swipes" on swipes for insert with check (auth.uid() = swiper_id);

create policy "Users can view their own matches" on matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);
create policy "Users can insert matches" on matches for insert with check (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Users can view messages of their matches" on messages for select using (
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);
create policy "Users can insert messages to their matches" on messages for insert with check (
  auth.uid() = sender_id and
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

create policy "Users can view own or approved confessions" on confessions for select using (
  sender_id = auth.uid() or
  (status = 'approved' and receiver_email = (select email from profiles where id = auth.uid()))
);
create policy "Users can insert their own confessions" on confessions for insert with check (auth.uid() = sender_id);

create policy "Users can view their own reports" on reports for select using (reporter_id = auth.uid());
create policy "Users can insert reports" on reports for insert with check (reporter_id = auth.uid());

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, real_name, department, year, gender, relationship_intent)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'real_name', '')),
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'year', ''),
    coalesce(new.raw_user_meta_data->>'gender', ''),
    coalesce(new.raw_user_meta_data->>'relationship_intent', 'friendship')
  );
  return new;
end;
$$ language plpgsql security definer;

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

create trigger ensure_valid_email
  before insert on auth.users
  for each row execute procedure public.validate_user_email();
