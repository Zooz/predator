CREATE MATERIALIZED VIEW last_reports_deprecated AS
SELECT * FROM reports_summary
WHERE report_id IS NOT NULL AND start_time IS NOT NULL AND test_id IS NOT NULL
PRIMARY KEY (start_time, report_id, test_id)
WITH CLUSTERING ORDER BY (start_time DESC);
