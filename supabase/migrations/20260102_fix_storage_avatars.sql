-- Create a new storage bucket for avatars if it doesn't exist
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up access policies for the avatars bucket

-- 1. Allow public access to view avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' and
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- 3. Allow users to update their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' and
    auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- 4. Allow users to delete their own avatar (optional but good practice)
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' and
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
