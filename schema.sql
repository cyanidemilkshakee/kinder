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
  gender_preferences jsonb default '{}'::jsonb,
  super_likes_today int default 0,
  super_likes_reset_at timestamp with time zone default now(),
  relationship_intents text[] default array['friendship'::text],
  read_receipts_enabled boolean default true not null,
  last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null,
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
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  reply_to_id uuid references public.messages on delete set null,
  message_type text default 'text' not null check (message_type in ('text', 'image', 'video', 'gif', 'audio')),
  media_path text,
  media_metadata jsonb default '{}'::jsonb not null,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists messages_match_created_at_idx
  on public.messages (match_id, created_at);

create index if not exists messages_match_unread_idx
  on public.messages (match_id, is_read, created_at desc);

create index if not exists messages_sidebar_unread_idx
  on public.messages (created_at desc, sender_id)
  where is_read = false and deleted_at is null;

create index if not exists messages_sidebar_undelivered_idx
  on public.messages (created_at desc, sender_id)
  where delivered_at is null and deleted_at is null;

-- MESSAGE REACTIONS
create table if not exists public.message_reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages on delete cascade not null,
  match_id uuid references public.matches on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id)
);

create index if not exists message_reactions_match_idx
  on public.message_reactions (match_id, message_id);

-- MUTED CONVERSATIONS
create table if not exists public.muted_matches (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(match_id, user_id)
);

create index if not exists muted_matches_user_match_idx
  on public.muted_matches (user_id, match_id);

-- Realtime Postgres Changes only emits rows from tables in this publication.
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end
$$;

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array['message_reactions', 'muted_matches', 'profiles', 'matches']
  loop
    if exists (
      select 1 from pg_publication where pubname = 'supabase_realtime'
    ) and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = realtime_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', realtime_table);
    end if;
  end loop;
end
$$;

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

create index if not exists super_likes_receiver_sender_idx
  on public.super_likes (receiver_id, sender_id);

create index if not exists super_likes_sender_created_idx
  on public.super_likes (sender_id, created_at desc);

-- BLOCKS
create table if not exists public.blocks (
  id uuid default gen_random_uuid() primary key,
  blocker_id uuid references public.profiles on delete cascade not null,
  blocked_id uuid references public.profiles on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique (blocker_id, blocked_id)
);

create index if not exists blocks_blocked_blocker_idx
  on public.blocks (blocked_id, blocker_id);

create index if not exists swipes_swiped_right_idx
  on public.swipes (swiped_id, is_right_swipe, swiper_id);

-- SUPPORT MESSAGES
create table if not exists public.support_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete set null,
  name text,
  message text not null,
  type text default 'contact' check (type in ('contact', 'bug')),
  screenshot_url text,
  allow_contact boolean default false not null,
  created_at timestamp with time zone default now() not null
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-media',
  'chat-media',
  false,
  26214400,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-screenshots',
  'feedback-screenshots',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


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
  add column if not exists gender_preferences jsonb default '{}'::jsonb,
  add column if not exists super_likes_today int default 0,
  add column if not exists super_likes_reset_at timestamp with time zone default now(),
  add column if not exists relationship_intents text[] default array['friendship'::text],
  add column if not exists username text,
  add column if not exists has_password boolean default false not null,
  add column if not exists read_receipts_enabled boolean default true not null,
  add column if not exists last_seen_at timestamp with time zone default timezone('utc'::text, now()) not null;

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

alter table public.messages
  add column if not exists edited_at timestamp with time zone,
  add column if not exists deleted_at timestamp with time zone,
  add column if not exists reply_to_id uuid references public.messages on delete set null,
  add column if not exists message_type text default 'text' not null,
  add column if not exists media_path text,
  add column if not exists media_metadata jsonb default '{}'::jsonb not null,
  add column if not exists delivered_at timestamp with time zone,
  add column if not exists read_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_message_type_check'
  ) then
    alter table public.messages
      add constraint messages_message_type_check
      check (message_type in ('text', 'image', 'video', 'gif', 'audio'));
  end if;
end
$$;

create or replace function public.enforce_message_insert_rules()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
begin
  if acting_user is null or new.sender_id is distinct from acting_user then
    raise exception 'Messages must be sent by the authenticated user';
  end if;

  new.content := btrim(coalesce(new.content, ''));
  new.is_read := false;
  new.edited_at := null;
  new.deleted_at := null;
  new.delivered_at := null;
  new.read_at := null;

  if new.message_type = 'text' and new.content = '' then
    raise exception 'Text messages cannot be empty';
  end if;

  if new.message_type != 'text' then
    if new.media_path is null
      or position(new.match_id::text || '/' || acting_user::text || '/' in new.media_path) != 1 then
      raise exception 'Media must belong to this conversation and sender';
    end if;
  end if;

  if new.reply_to_id is not null and not exists (
    select 1 from public.messages
    where id = new.reply_to_id
      and match_id = new.match_id
  ) then
    raise exception 'Reply target must belong to this conversation';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_message_insert_rules() from public;

drop trigger if exists enforce_message_insert_rules on public.messages;
create trigger enforce_message_insert_rules
before insert on public.messages
for each row execute function public.enforce_message_insert_rules();

create or replace function public.enforce_message_update_rules()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
begin
  if acting_user is null then
    raise exception 'Authentication required';
  end if;

  if old.deleted_at is not null then
    raise exception 'Deleted messages cannot be changed';
  end if;

  if acting_user = old.sender_id then
    if new.match_id is distinct from old.match_id
      or new.sender_id is distinct from old.sender_id
      or new.created_at is distinct from old.created_at
      or new.is_read is distinct from old.is_read
      or new.delivered_at is distinct from old.delivered_at
      or new.read_at is distinct from old.read_at
      or new.reply_to_id is distinct from old.reply_to_id
      or new.message_type is distinct from old.message_type
      or new.media_path is distinct from old.media_path
      or new.media_metadata is distinct from old.media_metadata then
      raise exception 'Senders can only edit or delete their message content';
    end if;

    if new.deleted_at is not null then
      new.content := '';
      new.media_path := null;
      new.media_metadata := '{}'::jsonb;
      new.deleted_at := timezone('utc'::text, now());
    elsif new.content is distinct from old.content then
      new.content := btrim(new.content);
      if new.content = '' then
        raise exception 'Message content cannot be empty';
      end if;
      new.edited_at := timezone('utc'::text, now());
    elsif new.edited_at is distinct from old.edited_at then
      raise exception 'Edited timestamp is managed by the database';
    end if;
  else
    if new.match_id is distinct from old.match_id
      or new.sender_id is distinct from old.sender_id
      or new.content is distinct from old.content
      or new.created_at is distinct from old.created_at
      or new.edited_at is distinct from old.edited_at
      or new.deleted_at is distinct from old.deleted_at
      or new.reply_to_id is distinct from old.reply_to_id
      or new.message_type is distinct from old.message_type
      or new.media_path is distinct from old.media_path
      or new.media_metadata is distinct from old.media_metadata
      or (old.is_read and not new.is_read) then
      raise exception 'Recipients can only update delivery and read status';
    end if;

    if old.delivered_at is not null then
      new.delivered_at := old.delivered_at;
    elsif new.delivered_at is not null then
      new.delivered_at := timezone('utc'::text, now());
    end if;

    if old.read_at is not null then
      new.read_at := old.read_at;
    elsif new.read_at is not null then
      if not coalesce((
        select read_receipts_enabled
        from public.profiles
        where id = acting_user
      ), true) then
        raise exception 'Read receipts are disabled';
      end if;

      new.read_at := timezone('utc'::text, now());
      new.delivered_at := coalesce(new.delivered_at, timezone('utc'::text, now()));
      new.is_read := true;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_message_update_rules() from public;

drop trigger if exists enforce_message_update_rules on public.messages;
create trigger enforce_message_update_rules
before update on public.messages
for each row execute function public.enforce_message_update_rules();

alter table public.support_messages
  add column if not exists screenshot_url text,
  add column if not exists allow_contact boolean default false not null;

create or replace function public.is_profile_active(profile_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id
      and coalesce(is_suspended, false) = false
      and (ban_expires_at is null or ban_expires_at <= now())
  );
$$;

revoke all on function public.is_profile_active(uuid) from public;
grant execute on function public.is_profile_active(uuid) to authenticated;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and coalesce(is_suspended, false) = false
      and (ban_expires_at is null or ban_expires_at <= now())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create or replace function public.resolve_login_email(login_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.email
  from public.profiles p
  where p.username = lower(regexp_replace(coalesce(login_username, ''), '[^a-z0-9_]', '_', 'g'))
    and coalesce(p.is_suspended, false) = false
    and (p.ban_expires_at is null or p.ban_expires_at <= now())
  limit 1;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

create or replace function public.enforce_super_like_limit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  recent_super_likes int;
begin
  if acting_user is null or new.sender_id is distinct from acting_user then
    raise exception 'Super likes must be sent by the authenticated user';
  end if;

  if new.sender_id = new.receiver_id then
    raise exception 'You cannot super like yourself';
  end if;

  if not (select public.is_profile_active(acting_user)) then
    raise exception 'Your account is currently restricted';
  end if;

  new.created_at := now();

  select count(*) into recent_super_likes
  from public.super_likes
  where sender_id = acting_user
    and created_at >= new.created_at - interval '24 hours';

  if recent_super_likes >= 3 then
    raise exception 'Daily super like limit reached';
  end if;

  perform set_config('app.super_like_counter_update', '1', true);

  update public.profiles
  set
    super_likes_today = recent_super_likes + 1,
    super_likes_reset_at = case
      when super_likes_reset_at is null
        or super_likes_reset_at <= new.created_at - interval '24 hours'
      then new.created_at
      else super_likes_reset_at
    end
  where id = acting_user;

  perform set_config('app.super_like_counter_update', '', true);

  return new;
end;
$$;

revoke all on function public.enforce_super_like_limit() from public;

drop trigger if exists enforce_super_like_limit on public.super_likes;
create trigger enforce_super_like_limit
before insert on public.super_likes
for each row execute function public.enforce_super_like_limit();

create or replace function public.enforce_profile_update_rules()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  super_like_counter_update boolean :=
    coalesce(current_setting('app.super_like_counter_update', true), '') = '1';
begin
  if acting_user = old.id then
    if new.id is distinct from old.id then
      raise exception 'Profile id cannot be changed';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Profile email is managed by authentication';
    end if;

    if new.role is distinct from old.role
      or new.is_suspended is distinct from old.is_suspended
      or new.ban_expires_at is distinct from old.ban_expires_at then
      raise exception 'Moderation fields cannot be changed by users';
    end if;

    if new.created_at is distinct from old.created_at then
      raise exception 'Profile creation timestamp cannot be changed';
    end if;

    if not super_like_counter_update
      and (
        new.super_likes_today is distinct from old.super_likes_today
        or new.super_likes_reset_at is distinct from old.super_likes_reset_at
      ) then
      raise exception 'Super like counters are managed by the database';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_update_rules() from public;

drop trigger if exists enforce_profile_update_rules on public.profiles;
create trigger enforce_profile_update_rules
before update on public.profiles
for each row execute function public.enforce_profile_update_rules();

create or replace function public.enforce_match_insert_rules()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  acting_user uuid := (select auth.uid());
  first_user uuid;
  second_user uuid;
begin
  if acting_user is null then
    raise exception 'Authentication required to create a match';
  end if;

  if new.user1_id = new.user2_id then
    raise exception 'A match requires two different users';
  end if;

  first_user := least(new.user1_id, new.user2_id);
  second_user := greatest(new.user1_id, new.user2_id);
  new.user1_id := first_user;
  new.user2_id := second_user;

  if acting_user not in (new.user1_id, new.user2_id) then
    raise exception 'Users can only create their own matches';
  end if;

  if not (select public.is_profile_active(new.user1_id))
    or not (select public.is_profile_active(new.user2_id)) then
    raise exception 'Both users must be active to match';
  end if;

  if not exists (
    select 1
    from public.swipes
    where swiper_id = new.user1_id
      and swiped_id = new.user2_id
      and is_right_swipe = true
  ) or not exists (
    select 1
    from public.swipes
    where swiper_id = new.user2_id
      and swiped_id = new.user1_id
      and is_right_swipe = true
  ) then
    raise exception 'Matches require mutual right swipes';
  end if;

  if exists (
    select 1
    from public.blocks
    where (blocker_id = new.user1_id and blocked_id = new.user2_id)
      or (blocker_id = new.user2_id and blocked_id = new.user1_id)
  ) then
    raise exception 'Blocked users cannot match';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_match_insert_rules() from public;

drop trigger if exists enforce_match_insert_rules on public.matches;
create trigger enforce_match_insert_rules
before insert on public.matches
for each row execute function public.enforce_match_insert_rules();

-- RLS POLICIES
alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.muted_matches enable row level security;
alter table public.confessions enable row level security;
alter table public.reports enable row level security;
alter table public.super_likes enable row level security;
alter table public.blocks enable row level security;
alter table public.support_messages enable row level security;

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile" on profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can view visible active profiles" on profiles;
create policy "Users can view visible active profiles" on profiles for select
to authenticated
using (
  (select auth.uid()) is not null
  and id <> (select auth.uid())
  and is_visible is true
  and username is not null
  and nullif(btrim(real_name), '') is not null
  and coalesce(is_suspended, false) = false
  and (ban_expires_at is null or ban_expires_at <= now())
);

drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles" on profiles for select
to authenticated
using ((select private.is_admin()));

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update
to authenticated
using ((select auth.uid()) = id and (select public.is_profile_active((select auth.uid()))))
with check ((select auth.uid()) = id and (select public.is_profile_active((select auth.uid()))));

-- Swipes Policies
drop policy if exists "Users can view their own swipes" on swipes;
create policy "Users can view their own swipes" on swipes for select using (auth.uid() = swiper_id or auth.uid() = swiped_id);

drop policy if exists "Users can insert their own swipes" on swipes;
create policy "Users can insert their own swipes" on swipes for insert
to authenticated
with check ((select auth.uid()) = swiper_id and (select public.is_profile_active((select auth.uid()))));

-- Matches Policies
drop policy if exists "Users can view their own matches" on matches;
create policy "Users can view their own matches" on matches for select using (auth.uid() = user1_id or auth.uid() = user2_id);

drop policy if exists "Users can insert matches" on matches;
create policy "Users can insert matches" on matches for insert
to authenticated
with check (
  ((select auth.uid()) = user1_id or (select auth.uid()) = user2_id)
  and user1_id <> user2_id
  and (select public.is_profile_active(user1_id))
  and (select public.is_profile_active(user2_id))
  and exists (
    select 1
    from public.swipes
    where swiper_id = matches.user1_id
      and swiped_id = matches.user2_id
      and is_right_swipe = true
  )
  and exists (
    select 1
    from public.swipes
    where swiper_id = matches.user2_id
      and swiped_id = matches.user1_id
      and is_right_swipe = true
  )
  and not exists (
    select 1
    from public.blocks
    where (blocker_id = matches.user1_id and blocked_id = matches.user2_id)
      or (blocker_id = matches.user2_id and blocked_id = matches.user1_id)
  )
);

drop policy if exists "Users can unmatch their own matches" on matches;
create policy "Users can unmatch their own matches" on matches for delete
to authenticated
using ((select auth.uid()) = user1_id or (select auth.uid()) = user2_id);

-- Messages Policies
drop policy if exists "Users can view messages of their matches" on messages;
create policy "Users can view messages of their matches" on messages for select
to authenticated
using (
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

drop policy if exists "Users can insert messages to their matches" on messages;
create policy "Users can insert messages to their matches" on messages for insert
to authenticated
with check (
  (select auth.uid()) = sender_id and
  (select public.is_profile_active((select auth.uid()))) and
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

drop policy if exists "Users can update messages of their matches" on messages;
drop policy if exists "Users can edit their own messages" on messages;
drop policy if exists "Recipients can mark messages as read" on messages;

create policy "Users can edit their own messages" on messages for update
to authenticated
using (
  auth.uid() = sender_id and
  (select public.is_profile_active((select auth.uid()))) and
  exists (
    select 1 from matches 
    where id = messages.match_id 
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
)
with check (
  auth.uid() = sender_id and
  exists (
    select 1 from matches
    where id = messages.match_id
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

create policy "Recipients can mark messages as read" on messages for update
to authenticated
using (
  auth.uid() != sender_id and
  (select public.is_profile_active((select auth.uid()))) and
  exists (
    select 1 from matches
    where id = messages.match_id
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
)
with check (
  auth.uid() != sender_id and
  exists (
    select 1 from matches
    where id = messages.match_id
    and (user1_id = auth.uid() or user2_id = auth.uid())
  )
);

-- The trigger separates sender edits from recipient read-status updates.
grant select, insert on table public.messages to authenticated;
revoke update on table public.messages from authenticated;
grant update (content, edited_at, deleted_at, is_read, delivered_at, read_at) on table public.messages to authenticated;

-- Message Reactions Policies
drop policy if exists "Matched users can view reactions" on message_reactions;
create policy "Matched users can view reactions" on message_reactions for select
to authenticated
using (
  exists (
    select 1 from public.matches
    where id = message_reactions.match_id
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Matched users can add reactions" on message_reactions;
create policy "Matched users can add reactions" on message_reactions for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.is_profile_active((select auth.uid())))
  and exists (
    select 1 from public.messages
    where id = message_reactions.message_id
      and match_id = message_reactions.match_id
      and deleted_at is null
  )
  and exists (
    select 1 from public.matches
    where id = message_reactions.match_id
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Users can update their reactions" on message_reactions;
create policy "Users can update their reactions" on message_reactions for update
to authenticated
using (user_id = (select auth.uid()) and (select public.is_profile_active((select auth.uid()))))
with check (user_id = (select auth.uid()) and (select public.is_profile_active((select auth.uid()))));

drop policy if exists "Users can remove their reactions" on message_reactions;
create policy "Users can remove their reactions" on message_reactions for delete
to authenticated
using (user_id = (select auth.uid()));

grant select, insert, delete on table public.message_reactions to authenticated;
revoke update on table public.message_reactions from authenticated;
grant update (emoji) on table public.message_reactions to authenticated;

-- Muted Conversations Policies
drop policy if exists "Users can view their muted conversations" on muted_matches;
create policy "Users can view their muted conversations" on muted_matches for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can mute their conversations" on muted_matches;
create policy "Users can mute their conversations" on muted_matches for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.is_profile_active((select auth.uid())))
  and exists (
    select 1 from public.matches
    where id = muted_matches.match_id
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Users can unmute their conversations" on muted_matches;
create policy "Users can unmute their conversations" on muted_matches for delete
to authenticated
using (user_id = (select auth.uid()));

grant select, insert, delete on table public.muted_matches to authenticated;

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
create policy "Users can insert their own confessions" on confessions for insert
to authenticated
with check ((select auth.uid()) = sender_id and (select public.is_profile_active((select auth.uid()))));

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
create policy "Users can insert their own super likes" on super_likes for insert
to authenticated
with check ((select auth.uid()) = sender_id and (select public.is_profile_active((select auth.uid()))));

-- Blocks Policies
drop policy if exists "Users can view blocks they created" on blocks;
drop policy if exists "Users can view blocks involving them" on blocks;
create policy "Users can view blocks involving them" on blocks for select
to authenticated
using ((select auth.uid()) = blocker_id or (select auth.uid()) = blocked_id);

drop policy if exists "Users can insert their own blocks" on blocks;
create policy "Users can insert their own blocks" on blocks for insert
to authenticated
with check ((select auth.uid()) = blocker_id and (select public.is_profile_active((select auth.uid()))));

drop policy if exists "Users can delete their own blocks" on blocks;
create policy "Users can delete their own blocks" on blocks for delete using (auth.uid() = blocker_id);

-- Support Messages Policies
drop policy if exists "Users can insert their own support messages" on support_messages;
create policy "Users can insert their own support messages" on support_messages for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users can view their own support messages" on support_messages;
create policy "Users can view their own support messages" on support_messages for select using (auth.uid() = user_id);

-- Explicit Data API grants for chat and safety actions.
revoke insert, update on table public.profiles from authenticated;
revoke select on table public.profiles from anon;
grant select on table public.profiles to authenticated;
grant insert (
  id,
  email,
  username,
  has_password,
  real_name,
  department,
  year,
  gender,
  bio,
  relationship_intent,
  date_of_birth,
  is_visible,
  avatar_url,
  photos,
  interest_tags,
  food_preference,
  drinking_habit,
  smoking_habit,
  interested_interests,
  interested_departments,
  interested_years,
  gender_preferences,
  relationship_intents,
  read_receipts_enabled
) on table public.profiles to authenticated;
grant update (
  username,
  has_password,
  real_name,
  department,
  year,
  gender,
  bio,
  relationship_intent,
  date_of_birth,
  is_visible,
  deletion_queued_at,
  avatar_url,
  photos,
  interest_tags,
  food_preference,
  drinking_habit,
  smoking_habit,
  interested_interests,
  interested_departments,
  interested_years,
  gender_preferences,
  relationship_intents,
  read_receipts_enabled,
  last_seen_at,
  super_likes_today,
  super_likes_reset_at
) on table public.profiles to authenticated;
grant select, insert on table public.swipes to authenticated;
grant select, insert, delete on table public.matches to authenticated;
grant insert on table public.reports to authenticated;
grant select, insert on table public.super_likes to authenticated;
grant select, insert, delete on table public.blocks to authenticated;
grant insert on table public.support_messages to anon, authenticated;
grant select on table public.support_messages to authenticated;

-- Public avatars are served by bucket visibility; writes stay scoped to each user folder.
drop policy if exists "Users can upload their avatars" on storage.objects;
create policy "Users can upload their avatars" on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update their avatars" on storage.objects;
create policy "Users can update their avatars" on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their avatars" on storage.objects;
create policy "Users can delete their avatars" on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner_id = (select auth.uid())::text
);

drop policy if exists "Users can upload feedback screenshots" on storage.objects;
create policy "Users can upload feedback screenshots" on storage.objects for insert
to authenticated
with check (
  bucket_id = 'feedback-screenshots'
  and owner_id = (select auth.uid())::text
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can read their feedback screenshots" on storage.objects;
create policy "Users can read their feedback screenshots" on storage.objects for select
to authenticated
using (
  bucket_id = 'feedback-screenshots'
  and owner_id = (select auth.uid())::text
);

-- Private chat media is readable only by participants in the matching conversation.
drop policy if exists "Matched users can read chat media" on storage.objects;
create policy "Matched users can read chat media" on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-media'
  and exists (
    select 1 from public.matches
    where (storage.foldername(name))[1] = matches.id::text
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Matched users can upload chat media" on storage.objects;
create policy "Matched users can upload chat media" on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1 from public.matches
    where (storage.foldername(name))[1] = matches.id::text
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Users can delete their chat media" on storage.objects;
create policy "Users can delete their chat media" on storage.objects for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and owner_id = (select auth.uid())::text
);

-- Private Broadcast and Presence topics are named match:<match uuid>.
drop policy if exists "Matched users can receive private chat realtime" on realtime.messages;
create policy "Matched users can receive private chat realtime" on realtime.messages for select
to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1 from public.matches
    where 'match:' || matches.id::text = (select realtime.topic())
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Matched users can send private chat realtime" on realtime.messages;
create policy "Matched users can send private chat realtime" on realtime.messages for insert
to authenticated
with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1 from public.matches
    where 'match:' || matches.id::text = (select realtime.topic())
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);


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

-- Trigger to enforce email domain has been removed to allow any email
drop trigger if exists ensure_valid_email on auth.users;
drop function if exists public.validate_user_email();

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


-- Private chat media is readable only by participants in the matching conversation.
drop policy if exists "Matched users can read chat media" on storage.objects;
create policy "Matched users can read chat media" on storage.objects for select
to authenticated
using (
  bucket_id = 'chat-media'
  and exists (
    select 1 from public.matches
    where (storage.foldername(name))[1] = matches.id::text
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Matched users can upload chat media" on storage.objects;
create policy "Matched users can upload chat media" on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-media'
  and owner_id = (select auth.uid())::text
  and exists (
    select 1 from public.matches
    where (storage.foldername(name))[1] = matches.id::text
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Users can delete their chat media" on storage.objects;
create policy "Users can delete their chat media" on storage.objects for delete
to authenticated
using (
  bucket_id = 'chat-media'
  and owner_id = (select auth.uid())::text
);

-- Private Broadcast and Presence topics are named match:<match uuid>.
drop policy if exists "Matched users can receive private chat realtime" on realtime.messages;
create policy "Matched users can receive private chat realtime" on realtime.messages for select
to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1 from public.matches
    where 'match:' || matches.id::text = (select realtime.topic())
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);

drop policy if exists "Matched users can send private chat realtime" on realtime.messages;
create policy "Matched users can send private chat realtime" on realtime.messages for insert
to authenticated
with check (
  realtime.messages.extension in ('broadcast', 'presence')
  and exists (
    select 1 from public.matches
    where 'match:' || matches.id::text = (select realtime.topic())
      and (user1_id = (select auth.uid()) or user2_id = (select auth.uid()))
  )
);


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

-- Trigger to enforce email domain has been removed to allow any email
drop trigger if exists ensure_valid_email on auth.users;
drop function if exists public.validate_user_email();

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

-- RPC FUNCTIONS FOR DISCOVERY AND LIKES

create or replace function public.get_discover_profiles(viewer_id uuid, limit_val int default 30)
returns setof public.profiles
language plpgsql
security definer
as $$
declare
  pref_interests text[];
  pref_departments text[];
  pref_years text[];
  excluded_ids uuid[];
begin
  -- Get user preferences
  select interested_interests, interested_departments, interested_years
  into pref_interests, pref_departments, pref_years
  from public.profiles
  where id = viewer_id;

  -- Build excluded ids
  select coalesce(array_agg(id), '{}'::uuid[]) into excluded_ids
  from (
    select viewer_id as id
    union
    select swiped_id from public.swipes where swiper_id = viewer_id
    union
    select blocked_id from public.blocks where blocker_id = viewer_id
    union
    select blocker_id from public.blocks where blocked_id = viewer_id
    union
    select receiver_id from public.super_likes where sender_id = viewer_id
  ) as excluded;

  return query
  select p.*
  from public.profiles p
  where p.is_visible = true
    and not (p.id = any(excluded_ids))
    and (cardinality(pref_departments) = 0 or p.department = any(pref_departments))
    and (cardinality(pref_years) = 0 or p.year = any(pref_years))
    and (cardinality(pref_interests) = 0 or pref_interests && p.interest_tags)
  limit limit_val;
end;
$$;

create or replace function public.get_pending_likers(viewer_id uuid)
returns setof public.profiles
language sql
security definer
as $$
  select p.*
  from public.profiles p
  join public.swipes s on s.swiper_id = p.id
  where s.swiped_id = viewer_id
    and s.is_right_swipe = true
    and p.is_visible = true
    and p.id not in (
      select swiped_id from public.swipes where swiper_id = viewer_id
    )
    and p.id not in (
      select blocked_id from public.blocks where blocker_id = viewer_id
      union
      select blocker_id from public.blocks where blocked_id = viewer_id
    );
$$;
