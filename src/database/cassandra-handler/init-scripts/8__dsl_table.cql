CREATE TABLE IF NOT EXISTS dsl(
dsl_name text,
definition_name text,
artillery_json text, // The json that has been generated for the Artillery
PRIMARY KEY (dsl_name, definition_name)
)
WITH compression = { 'sstable_compression' : 'LZ4Compressor' };