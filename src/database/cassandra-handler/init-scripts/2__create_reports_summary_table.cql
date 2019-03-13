CREATE TABLE IF NOT EXISTS reports_summary(
test_id uuid,
revision_id uuid,
report_id text,
test_configuration text,
last_updated_at timestamp,
start_time timestamp,
test_name text,
test_description text,
job_id text,
test_type text,
notes text,
phase text,
PRIMARY KEY (test_id, report_id));
