create extension if not exists "pgcrypto";

create table decision_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  learning_goal text not null,
  preference text null,
  status text not null default 'pending',
  recommended_resource_title text null,
  confidence_level text null,
  confidence_reason text null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint decision_sessions_status_check
    check (status in ('pending', 'processing', 'completed', 'failed')),

  constraint decision_sessions_preference_check
    check (
      preference is null or preference in (
        'quick_overview',
        'hands_on_project',
        'deep_understanding',
        'interview_prep'
      )
    ),

  constraint decision_sessions_confidence_level_check
    check (
      confidence_level is null or confidence_level in ('high', 'medium', 'low')
    )
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references decision_sessions(id) on delete cascade,
  position integer not null,
  input_text text not null,
  url text null,
  normalized_url text null,
  title text null,
  source_type text not null,
  extracted_title text null,
  extracted_description text null,
  content_type text null,
  estimated_time_minutes integer null,
  evidence_level text not null default 'title_only',
  created_at timestamptz not null default now(),

  constraint resources_source_type_check
    check (source_type in ('url', 'title_only')),

  constraint resources_evidence_level_check
    check (evidence_level in ('title_only', 'metadata', 'partial_content')),

  constraint resources_position_unique unique (session_id, position)
);

create table recommendation_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references decision_sessions(id) on delete cascade,
  primary_resource_id uuid not null references resources(id),
  primary_reason text not null,
  comparative_summary text not null,
  created_at timestamptz not null default now()
);

create table recommendation_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references decision_sessions(id) on delete cascade,
  resource_id uuid not null references resources(id),
  category text not null,
  rank integer null,
  reason text not null,
  created_at timestamptz not null default now(),

  constraint recommendation_items_category_check
    check (category in ('primary', 'complementary', 'not_recommended_now')),

  constraint recommendation_items_resource_unique unique (session_id, resource_id)
);

create index resources_session_id_idx on resources(session_id);
create index recommendation_items_session_id_idx on recommendation_items(session_id);
create index decision_sessions_created_at_idx on decision_sessions(created_at desc);
