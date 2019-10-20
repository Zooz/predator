CREATE TABLE IF NOT EXISTS processors
(
    processor_id       uuid,
    name               text,
    description        text,
    type               text,
    file_url           text,
    javascript         text,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (processor_id)
);
