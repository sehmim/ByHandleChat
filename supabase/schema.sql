create table if not exists public.chatbot_configs (
  chatbot_id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.chatbot_configs is 'Stores per-chatbot widget configuration blobs';
