create table if not exists public.daily_likes (
  id bigint generated always as identity primary key,
  request_key text not null unique,
  uid text not null,
  region text not null,
  request_date date not null,
  api_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.daily_likes enable row level security;
-- Do not create public read/write policies. Only the server function uses the service-role key.
