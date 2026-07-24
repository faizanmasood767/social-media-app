-- Run this whole file in Supabase Dashboard -> SQL Editor -> New query -> Run
-- It creates every table this app needs.

create extension if not exists "pgcrypto";

-- ============ USERS ============
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username varchar(30) unique not null,
  email varchar(255) unique not null,
  password_hash text not null,
  bio text default '',
  avatar_color varchar(7) default '#3D5A45', -- used for the monogram avatar
  created_at timestamptz default now()
);

-- ============ POSTS ============
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_posts_user on posts(user_id);
create index if not exists idx_posts_created on posts(created_at desc);

-- ============ COMMENTS ============
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_comments_post on comments(post_id);

-- ============ LIKES ============
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

create index if not exists idx_likes_post on likes(post_id);

-- ============ FOLLOWS ============
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references users(id) on delete cascade,   -- the person who clicks "Follow"
  following_id uuid not null references users(id) on delete cascade,  -- the person being followed
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

-- Note: We are NOT using Supabase Auth or Row Level Security here.
-- The Express server uses the service_role key and enforces all rules itself
-- (via JWT auth middleware), which keeps things simple for this project.
