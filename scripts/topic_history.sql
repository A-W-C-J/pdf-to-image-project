create table public.topic_history (
  id uuid not null default gen_random_uuid (),
  topic text not null,
  website_url text not null default 'https://www.pdf2img.top/'::text,
  language text not null default '中文'::text,
  used_count integer null default 1,
  last_used_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint topic_history_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_topic_history_topic on public.topic_history using btree (topic) TABLESPACE pg_default;

create index IF not exists idx_topic_history_website_url on public.topic_history using btree (website_url) TABLESPACE pg_default;

create index IF not exists idx_topic_history_language on public.topic_history using btree (language) TABLESPACE pg_default;

create index IF not exists idx_topic_history_used_count on public.topic_history using btree (used_count desc) TABLESPACE pg_default;

create index IF not exists idx_topic_history_last_used_at on public.topic_history using btree (last_used_at desc) TABLESPACE pg_default;

create index IF not exists idx_topic_history_website_lang_used on public.topic_history using btree (
  website_url,
  language,
  used_count desc,
  last_used_at desc
) TABLESPACE pg_default;

create trigger update_topic_history_updated_at BEFORE
update on topic_history for EACH row
execute FUNCTION update_updated_at_column ();