-- supabase/migrations/20260505_notification_hour_range.sql
-- Add 'hour_of_day_range' rule type. Value stored as "<start>-<end>" with
-- both bounds inclusive, integers in 0–23, start <= end (no wrap-around).

alter table notification_rules drop constraint if exists notification_rules_type_check;

alter table notification_rules add constraint notification_rules_type_check
  check (type in (
    'species_score', 'global_score',
    'wind_speed', 'coefficient', 'tide_phase', 'pressure_trend',
    'cloud_cover', 'hour_of_day_range'
  ));
