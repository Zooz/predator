CREATE TABLE IF NOT EXISTS tests(
id uuid,
updated_at timestamp,
raw_data text, // The request as is that came from the client
artillery_json text, // The json that has been generated for the Artillery
file_id uuid,
revision_id uuid,
name text,
type text,
description text,
PRIMARY KEY (id, updated_at)
)
WITH compression = { 'sstable_compression' : 'LZ4Compressor' };