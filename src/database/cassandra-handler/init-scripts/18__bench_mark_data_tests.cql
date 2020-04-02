CREATE TABLE IF NOT EXISTS benchmarks(
test_id uuid,
data text,
PRIMARY KEY (test_id));
---
ALTER TABLE reports_summary ADD weights_data text;
