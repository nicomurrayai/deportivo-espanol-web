drop index if exists public.fixture_partidos_temporada_fecha_idx;

alter table public.fixture_partidos
    drop column if exists temporada,
    drop column if exists torneo;

alter table public.fixture_partidos enable row level security;
