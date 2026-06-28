-- ============================================================================
-- Corrective migration: authoritatively reset RLS for the eleven_auction schema.
--
-- Why: a participant INSERT was being rejected ("new row violates row-level
-- security policy for table room_participants") for any non-host user joining a
-- room, which made it impossible to join a room you didn't create. The intended
-- insert rule is simply `user_id = auth.uid()` (you may add yourself). This
-- migration drops ALL existing policies on each app table (clearing any drifted
-- or stray policy) and recreates the intended set. Safe to run multiple times.
-- ============================================================================

-- Ensure helper functions are current.
create or replace function eleven_auction.is_room_member(p_room_id uuid)
returns boolean language sql security definer set search_path = eleven_auction stable as $$
  select exists (
    select 1 from eleven_auction.room_participants rp
    where rp.room_id = p_room_id and rp.user_id = auth.uid()
  );
$$;

create or replace function eleven_auction.is_room_host(p_room_id uuid)
returns boolean language sql security definer set search_path = eleven_auction stable as $$
  select exists (
    select 1 from eleven_auction.rooms r
    where r.id = p_room_id and r.host_id = auth.uid()
  );
$$;

-- Drop every existing policy on each app table, then recreate the intended ones.
do $$
declare
  tbl text;
  pol record;
begin
  foreach tbl in array
    array['profiles', 'rooms', 'queue_items', 'messages', 'room_participants']
  loop
    for pol in
      select policyname from pg_policies
      where schemaname = 'eleven_auction' and tablename = tbl
    loop
      execute format('drop policy if exists %I on eleven_auction.%I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- Make sure RLS is enabled.
alter table eleven_auction.profiles          enable row level security;
alter table eleven_auction.rooms             enable row level security;
alter table eleven_auction.queue_items       enable row level security;
alter table eleven_auction.messages          enable row level security;
alter table eleven_auction.room_participants enable row level security;

-- profiles
create policy profiles_select on eleven_auction.profiles
  for select to authenticated using (true);
create policy profiles_insert on eleven_auction.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update on eleven_auction.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- rooms
create policy rooms_select on eleven_auction.rooms
  for select to authenticated using (true);
create policy rooms_insert on eleven_auction.rooms
  for insert to authenticated with check (host_id = auth.uid());
create policy rooms_update on eleven_auction.rooms
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
create policy rooms_delete on eleven_auction.rooms
  for delete to authenticated using (host_id = auth.uid());

-- room_participants  (the fix: any signed-in user may add THEMSELVES)
create policy participants_select on eleven_auction.room_participants
  for select to authenticated
  using (eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id));
create policy participants_insert on eleven_auction.room_participants
  for insert to authenticated with check (user_id = auth.uid());
create policy participants_update on eleven_auction.room_participants
  for update to authenticated
  using (eleven_auction.is_room_host(room_id) or user_id = auth.uid())
  with check (eleven_auction.is_room_host(room_id) or user_id = auth.uid());
create policy participants_delete on eleven_auction.room_participants
  for delete to authenticated
  using (eleven_auction.is_room_host(room_id) or user_id = auth.uid());

-- queue_items
create policy queue_select on eleven_auction.queue_items
  for select to authenticated
  using (eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id));
create policy queue_insert on eleven_auction.queue_items
  for insert to authenticated
  with check ((eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id))
              and added_by = auth.uid());
create policy queue_update on eleven_auction.queue_items
  for update to authenticated
  using (eleven_auction.is_room_host(room_id)) with check (eleven_auction.is_room_host(room_id));
create policy queue_delete on eleven_auction.queue_items
  for delete to authenticated
  using (eleven_auction.is_room_host(room_id) or added_by = auth.uid());

-- messages
create policy messages_select on eleven_auction.messages
  for select to authenticated
  using (eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id));
create policy messages_insert on eleven_auction.messages
  for insert to authenticated
  with check ((eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id))
              and user_id = auth.uid());
