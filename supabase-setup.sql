-- Dieses SQL in Supabase > SQL Editor ausführen

-- pgvector Extension aktivieren
create extension if not exists vector;

-- Tabelle für die Profildaten
create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1536)
);

-- Suchfunktion für ähnliche Dokumente
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from documents
  order by embedding <=> query_embedding
  limit match_count;
$$;
