-- supabase/migrations/20260428_notifications.sql

-- Table des zones géographiques
create table if not exists zones (
  id text primary key,
  name text not null,
  latitude numeric not null,
  longitude numeric not null,
  timezone text not null default 'Europe/Paris',
  active boolean not null default true
);

insert into zones (id, name, latitude, longitude, timezone, active)
values ('arcachon', 'Bassin d''Arcachon', 44.66, -1.17, 'Europe/Paris', true)
on conflict (id) do nothing;

-- Table des subscriptions push (endpoint VAPID par appareil)
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id);

-- Table des règles de notification (AND logic)
create table if not exists notification_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  zone_id text references zones not null default 'arcachon',
  type text not null check (type in (
    'species_score', 'global_score',
    'wind_speed', 'coefficient', 'tide_phase', 'pressure_trend'
  )),
  species_id text,
  operator text not null check (operator in ('>', '<', '>=', '<=', '=')),
  value text not null,
  enabled boolean not null default true,
  created_at timestamptz default now()
);

alter table notification_rules enable row level security;

create policy "Users manage own notification rules"
  on notification_rules for all
  using (auth.uid() = user_id);

-- Table de log anti-doublon
create table if not exists notification_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  zone_id text references zones not null,
  target_date date not null,
  horizon_days integer not null,
  triggered_at timestamptz default now(),
  scores_snapshot jsonb
);

create unique index if not exists notification_log_dedup
  on notification_log (user_id, zone_id, target_date, horizon_days, (triggered_at::date));

alter table notification_log enable row level security;

create policy "Users read own notification log"
  on notification_log for select
  using (auth.uid() = user_id);

alter table zones enable row level security;

create policy "Zones are publicly readable"
  on zones for select
  using (true);

-- Modifications user_settings
alter table user_settings
  add column if not exists subscribed_zones text[] default '{arcachon}',
  add column if not exists notification_horizons int[] default '{1}',
  add column if not exists notification_days int[] default '{1,2,3,4,5,6,7}';

alter table user_settings
  drop column if exists notifications_enabled,
  drop column if exists notification_min_score,
  drop column if exists notification_time_range;

create index if not exists notification_rules_user_zone
  on notification_rules (user_id, zone_id) where enabled = true;

create index if not exists push_subscriptions_user_id
  on push_subscriptions (user_id);

create index if not exists notification_log_triggered_at
  on notification_log (triggered_at);
