create table if not exists public.contact_rate_limits (
    ip_hash text not null,
    window_start timestamptz not null,
    request_count integer not null default 0,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    primary key (ip_hash, window_start)
);

create index if not exists contact_rate_limits_window_start_idx
    on public.contact_rate_limits (window_start);

create or replace function public.enforce_contact_rate_limit(
    ip_hash_input text,
    request_time timestamptz default timezone('utc'::text, now())
)
returns table (
    allowed boolean,
    request_count integer,
    retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
    current_window timestamptz := date_trunc('minute', request_time);
    current_count integer;
begin
    if coalesce(length(trim(ip_hash_input)), 0) = 0 then
        raise exception 'ip_hash_input is required';
    end if;

    insert into public.contact_rate_limits as rate_limit (
        ip_hash,
        window_start,
        request_count
    )
    values (
        trim(ip_hash_input),
        current_window,
        1
    )
    on conflict (ip_hash, window_start)
    do update
    set
        request_count = rate_limit.request_count + 1,
        updated_at = timezone('utc'::text, now())
    returning request_count into current_count;

    delete from public.contact_rate_limits
    where window_start < timezone('utc'::text, now()) - interval '2 days';

    if current_count > 5 then
        return query
        select
            false,
            current_count,
            greatest(
                1,
                ceil(extract(epoch from ((current_window + interval '1 minute') - request_time)))
            )::integer;
        return;
    end if;

    return query
    select true, current_count, 0;
end;
$$;

revoke all on table public.contact_rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.contact_rate_limits to service_role;

revoke all on function public.enforce_contact_rate_limit(text, timestamptz) from public;
grant execute on function public.enforce_contact_rate_limit(text, timestamptz) to service_role;