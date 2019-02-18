CREATE TABLE IF NOT EXISTS jobs(
id uuid,
test_id uuid,
environment text,
cron_expression text,
arrival_rate int,
duration int,
ramp_to int,
webhooks list<text>,
emails list<text>,
parallelism int,
max_virtual_users int,
notes text,
PRIMARY KEY (id)
);