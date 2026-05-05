-- supabase/migrations/20260504_notification_cloud_cover.sql
-- Add 'cloud_cover' rule type and refine tide_phase values (etale → etale_pm/etale_bm)

alter table notification_rules drop constraint if exists notification_rules_type_check;

alter table notification_rules add constraint notification_rules_type_check
  check (type in (
    'species_score', 'global_score',
    'wind_speed', 'coefficient', 'tide_phase', 'pressure_trend',
    'cloud_cover'
  ));

update notification_rules
  set value = 'etale_pm'
  where type = 'tide_phase' and value = 'etale';
