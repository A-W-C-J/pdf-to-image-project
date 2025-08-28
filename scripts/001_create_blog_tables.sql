create table public.blog_posts (
  id uuid not null default gen_random_uuid (),
  title text not null,
  excerpt text not null,
  content text not null,
  tags text[] null default '{}'::text[],
  seo_keywords text[] null default '{}'::text[],
  slug text not null,
  published boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  topic text null,
  language text null default '中文'::text,
  constraint blog_posts_pkey primary key (id),
  constraint blog_posts_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_published on public.blog_posts using btree (published) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_created_at on public.blog_posts using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_slug on public.blog_posts using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_topic on public.blog_posts using btree (topic) TABLESPACE pg_default;

create index IF not exists idx_blog_posts_language on public.blog_posts using btree (language) TABLESPACE pg_default;

create trigger update_blog_posts_updated_at BEFORE
update on blog_posts for EACH row
execute FUNCTION update_updated_at_column ();