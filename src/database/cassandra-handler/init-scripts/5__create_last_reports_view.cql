CREATE TABLE IF NOT EXISTS last_reports(
test_id uuid,
start_time_year int,
start_time_month int,
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
PRIMARY KEY ((start_time_year,start_time_month ,report_id, test_id),start_time)
WITH CLUSTERING ORDER BY (start_time DESC));
