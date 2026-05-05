-- supabase/migrations/20260506_notification_wave_wind_direction.sql
-- Add 'swell_height' (numeric, meters) and 'wind_direction' (multi-select cardinal sectors)
-- rule types. wind_direction value stored as comma-separated codes among
-- N, NE, E, SE, S, SO, O, NO (e.g. "N,NO"). The engine buckets the actual wind
-- direction (degrees) into the nearest 45° sector for comparison.

alter table notification_rules drop constraint if exists notification_rules_type_check;

alter table notification_rules add constraint notification_rules_type_check
  check (type in (
    'species_score', 'global_score',
    'wind_speed', 'wind_direction', 'coefficient',
    'tide_phase', 'pressure_trend',
    'cloud_cover', 'swell_height',
    'hour_of_day_range'
  ));
