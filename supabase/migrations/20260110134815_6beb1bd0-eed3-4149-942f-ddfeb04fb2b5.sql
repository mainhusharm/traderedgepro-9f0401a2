-- Create admin sessions table for password-based admin access tokens
create table if not exists public.admin_sessions (
  token uuid primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Enable RLS (no policies: table is not accessible from client)
alter table public.admin_sessions enable row level security;

-- Helpful index for expiry cleanup/lookup
create index if not exists admin_sessions_expires_at_idx on public.admin_sessions (expires_at);
