-- ============================================================================
-- Watch Together Platform — initial schema
-- Schema: eleven_auction  (isolated from the project's `public` schema)
-- Tables: profiles, rooms, queue_items, messages, room_participants
-- Plus: RLS policies, helper functions, auth trigger, realtime publication.
--
-- Apply via Supabase Dashboard → SQL Editor (paste & run).
-- IMPORTANT: also add `eleven_auction` to Settings → API → Exposed schemas,
-- otherwise the REST API / supabase-js cannot see these tables.
-- ============================================================================

create extension if not exists pgcrypto;
create schema if not exists eleven_auction;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- One profile per auth user. Auto-created by the handle_new_user() trigger.
create table if not exists eleven_auction.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#6366f1',
  created_at   timestamptz not null default now()
);

-- A watch room. Its playback_* columns are the PERSISTED source of truth used
-- for late-joiner sync and room restoration.
create table if not exists eleven_auction.rooms (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  host_id             uuid not null references eleven_auction.profiles (id) on delete cascade,
  is_public           boolean not null default true,
  status              text not null default 'lobby'
                        check (status in ('lobby', 'watching', 'ended')),
  current_item_id     uuid,  -- FK added after queue_items exists (circular ref)
  is_playing          boolean not null default false,
  position_seconds    double precision not null default 0,
  playback_updated_at timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

-- The shared watch queue for a room.
create table if not exists eleven_auction.queue_items (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references eleven_auction.rooms (id) on delete cascade,
  youtube_video_id text not null,
  title            text,
  url              text not null,
  position         integer not null default 0,
  added_by         uuid references eleven_auction.profiles (id) on delete set null,
  played           boolean not null default false,
  created_at       timestamptz not null default now()
);

-- Close the circular reference: rooms.current_item_id -> queue_items.id
alter table eleven_auction.rooms
  drop constraint if exists rooms_current_item_id_fkey;
alter table eleven_auction.rooms
  add constraint rooms_current_item_id_fkey
  foreign key (current_item_id) references eleven_auction.queue_items (id) on delete set null;

-- Persisted chat (also drives realtime chat via postgres_changes).
create table if not exists eleven_auction.messages (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references eleven_auction.rooms (id) on delete cascade,
  user_id      uuid references eleven_auction.profiles (id) on delete set null,
  display_name text not null,
  content      text not null,
  type         text not null default 'chat' check (type in ('chat', 'system')),
  created_at   timestamptz not null default now()
);

-- Persisted room membership + role. Live presence is layered on top via Realtime.
create table if not exists eleven_auction.room_participants (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid not null references eleven_auction.rooms (id) on delete cascade,
  user_id   uuid not null references eleven_auction.profiles (id) on delete cascade,
  role      text not null default 'viewer' check (role in ('host', 'viewer')),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists queue_items_room_position_idx
  on eleven_auction.queue_items (room_id, position);
create index if not exists messages_room_created_idx
  on eleven_auction.messages (room_id, created_at);
create index if not exists room_participants_room_idx
  on eleven_auction.room_participants (room_id);

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER → bypass RLS, avoiding policy recursion)
-- ----------------------------------------------------------------------------
create or replace function eleven_auction.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = eleven_auction
stable
as $$
  select exists (
    select 1 from eleven_auction.room_participants rp
    where rp.room_id = p_room_id and rp.user_id = auth.uid()
  );
$$;

create or replace function eleven_auction.is_room_host(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = eleven_auction
stable
as $$
  select exists (
    select 1 from eleven_auction.rooms r
    where r.id = p_room_id and r.host_id = auth.uid()
  );
$$;

-- Auto-create a profile when a new auth user signs up.
create or replace function eleven_auction.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = eleven_auction
as $$
begin
  insert into eleven_auction.profiles (id, display_name, avatar_color)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''),
             split_part(new.email, '@', 1)),
    '#' || substr(md5(new.id::text), 1, 6)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function eleven_auction.handle_new_user();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table eleven_auction.profiles          enable row level security;
alter table eleven_auction.rooms             enable row level security;
alter table eleven_auction.queue_items       enable row level security;
alter table eleven_auction.messages          enable row level security;
alter table eleven_auction.room_participants enable row level security;

-- profiles: any signed-in user may read profiles (to show names/colors);
-- users may only create/update their own.
drop policy if exists profiles_select on eleven_auction.profiles;
create policy profiles_select on eleven_auction.profiles
  for select to authenticated using (true);

drop policy if exists profiles_insert on eleven_auction.profiles;
create policy profiles_insert on eleven_auction.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update on eleven_auction.profiles;
create policy profiles_update on eleven_auction.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- rooms: readable by any signed-in user (join-by-code; the code is the secret).
-- Only the host may create/update/delete — this enforces HOST-ONLY playback
-- writes at the database layer, not just in the UI.
drop policy if exists rooms_select on eleven_auction.rooms;
create policy rooms_select on eleven_auction.rooms
  for select to authenticated using (true);

drop policy if exists rooms_insert on eleven_auction.rooms;
create policy rooms_insert on eleven_auction.rooms
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists rooms_update on eleven_auction.rooms;
create policy rooms_update on eleven_auction.rooms
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists rooms_delete on eleven_auction.rooms;
create policy rooms_delete on eleven_auction.rooms
  for delete to authenticated using (host_id = auth.uid());

-- room_participants: visible to fellow members/host; you may join/leave yourself;
-- the host may manage roles/kick.
drop policy if exists participants_select on eleven_auction.room_participants;
create policy participants_select on eleven_auction.room_participants
  for select to authenticated
  using (eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id));

drop policy if exists participants_insert on eleven_auction.room_participants;
create policy participants_insert on eleven_auction.room_participants
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists participants_update on eleven_auction.room_participants;
create policy participants_update on eleven_auction.room_participants
  for update to authenticated
  using (eleven_auction.is_room_host(room_id) or user_id = auth.uid())
  with check (eleven_auction.is_room_host(room_id) or user_id = auth.uid());

drop policy if exists participants_delete on eleven_auction.room_participants;
create policy participants_delete on eleven_auction.room_participants
  for delete to authenticated
  using (eleven_auction.is_room_host(room_id) or user_id = auth.uid());

-- queue_items: members/host may read; members may add (added_by must be self);
-- host may reorder/update; host or the original adder may remove.
drop policy if exists queue_select on eleven_auction.queue_items;
create policy queue_select on eleven_auction.queue_items
  for select to authenticated
  using (eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id));

drop policy if exists queue_insert on eleven_auction.queue_items;
create policy queue_insert on eleven_auction.queue_items
  for insert to authenticated
  with check ((eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id))
              and added_by = auth.uid());

drop policy if exists queue_update on eleven_auction.queue_items;
create policy queue_update on eleven_auction.queue_items
  for update to authenticated
  using (eleven_auction.is_room_host(room_id)) with check (eleven_auction.is_room_host(room_id));

drop policy if exists queue_delete on eleven_auction.queue_items;
create policy queue_delete on eleven_auction.queue_items
  for delete to authenticated
  using (eleven_auction.is_room_host(room_id) or added_by = auth.uid());

-- messages: members/host may read; members may post as themselves.
drop policy if exists messages_select on eleven_auction.messages;
create policy messages_select on eleven_auction.messages
  for select to authenticated
  using (eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id));

drop policy if exists messages_insert on eleven_auction.messages;
create policy messages_insert on eleven_auction.messages
  for insert to authenticated
  with check ((eleven_auction.is_room_member(room_id) or eleven_auction.is_room_host(room_id))
              and user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Grants: expose the schema to the API roles (PostgREST). RLS still applies.
-- ----------------------------------------------------------------------------
grant usage on schema eleven_auction to anon, authenticated, service_role;
grant all on all tables in schema eleven_auction to anon, authenticated, service_role;
grant all on all routines in schema eleven_auction to anon, authenticated, service_role;
grant all on all sequences in schema eleven_auction to anon, authenticated, service_role;
alter default privileges in schema eleven_auction
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema eleven_auction
  grant all on routines to anon, authenticated, service_role;
alter default privileges in schema eleven_auction
  grant all on sequences to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Realtime: expose tables for postgres_changes (chat, queue, participants).
-- replica identity full → UPDATE/DELETE events carry the full row.
-- ----------------------------------------------------------------------------
alter table eleven_auction.messages          replica identity full;
alter table eleven_auction.queue_items       replica identity full;
alter table eleven_auction.room_participants replica identity full;
alter table eleven_auction.rooms             replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['messages', 'queue_items', 'room_participants', 'rooms'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'eleven_auction' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table eleven_auction.%I', t);
    end if;
  end loop;
end $$;
