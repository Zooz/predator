CREATE TABLE IF NOT EXISTS reports_stats(
container_id text,
test_id uuid,
report_id text,
stats_id uuid,
stats_time timestamp,
phase_status text,
data text,
phase_index text,
PRIMARY KEY ((test_id, report_id), stats_time)) WITH CLUSTERING ORDER BY (stats_time ASC);