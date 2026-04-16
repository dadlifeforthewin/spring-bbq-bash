-- Create private photos bucket
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Deny all anon access; admin/server routes use signed URLs
create policy "no anon photo reads"
  on storage.objects for select
  to anon
  using (false);

-- service_role role bypasses RLS by default; server-side routes use the service role key
