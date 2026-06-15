-- Add new fields to existing profiles table
alter table public.profiles 
add column if not exists is_visible boolean default true,
add column if not exists deletion_queued_at timestamp with time zone;

-- Create an "avatars" bucket for user profile pictures
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true);

-- Allow public read access to avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatars
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Allow users to update or delete their own avatars
create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

create policy "Anyone can delete their own avatar."
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );
