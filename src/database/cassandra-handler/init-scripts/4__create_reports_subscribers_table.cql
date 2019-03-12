CREATE TABLE IF NOT EXISTS report_subscribers(
test_id uuid,
report_id text,
runner_id uuid,
stage text,
PRIMARY KEY (test_id, report_id, runner_id));