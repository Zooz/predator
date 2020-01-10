CREATE MATERIALIZED VIEW tests_processors_id_mapping AS

       SELECT id, processor_id, updated_at, name FROM tests

       WHERE id IS NOT NULL AND processor_id IS NOT NULL AND updated_at IS NOT NULL

       PRIMARY KEY ((processor_id), id, updated_at)
