-- supabase/migrations/20260504_notification_cloud_cover.sql
-- Add 'cloud_cover' to the allowed values for notification_rules.type

alter table notification_rules drop constraint if exists notification_rules_type_check;

alter table notification_rules add constraint notification_rules_type_check
  check (type in (
    'species_score', 'global_score',
    'wind_speed', 'coefficient', 'tide_phase', 'pressure_trend',
    'cloud_cover'
  ));
