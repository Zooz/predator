CREATE TABLE IF NOT EXISTS processors
(
    id                 uuid,
    name               text,
    description        text,
    javascript         text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (id, created_at))
    WITH CLUSTERING ORDER BY (created_at DESC);
---
ALTER TABLE tests ADD processor_id uuid;