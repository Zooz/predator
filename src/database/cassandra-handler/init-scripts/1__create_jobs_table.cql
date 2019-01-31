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
PRIMARY KEY (id)
);