-- ============================================================================
-- Voice notes: allow a 'voice' message type + a Storage bucket for the audio.
-- Apply via Supabase Dashboard → SQL Editor.
-- ============================================================================

-- 1. Allow 'voice' messages (content holds "<publicUrl>|<durationSeconds>").
alter table eleven_auction.messages drop constraint if exists messages_type_check;
alter table eleven_auction.messages
  add constraint messages_type_check check (type in ('chat', 'system', 'voice'));

-- 2. Public-read Storage bucket for the audio clips.
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', true)
on conflict (id) do nothing;

-- 3. Storage policies: authenticated users may upload; anyone may read.
drop policy if exists "voice_notes_insert" on storage.objects;
create policy "voice_notes_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'voice-notes');

drop policy if exists "voice_notes_read" on storage.objects;
create policy "voice_notes_read" on storage.objects
  for select
  using (bucket_id = 'voice-notes');
