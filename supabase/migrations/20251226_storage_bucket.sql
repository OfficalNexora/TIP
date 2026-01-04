-- Create a private bucket for audit uploads
insert into storage.buckets (id, name, public)
values ('audit-uploads', 'audit-uploads', false)
on conflict (id) do nothing;

-- Note: We are not setting extensive RLS policies here because:
-- 1. The bucket is private (public = false).
-- 2. All file operations (Upload/Read/Delete) are orchestrated by the Backend.
-- 3. The Backend uses the Service Role Key, which bypasses RLS.

-- However, as a safeguard, we deny all public access explicitly if RLS is enabled on storage.objects
alter table storage.objects enable row level security;
