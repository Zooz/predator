# Streaming
!!! TIP "Supported from version zooz/predator:1.6.0"

Produce informative resources to streaming platforms that will allow you to create consumers
and handle the data as you see fit. The resources published have a generic schema with all of the test, job, and reports 
information associated with the event that was triggered. For more specific details about the attributes published
<u>[refer here](streaming.md#resources-published)</u>.

## Setting Up
Currently, only Kafka is supported. We will appreciate contributions for more streaming platform integrations :)

### Kafka
For the full configuration needed please refer to: <u>[Kafka configuration manual](configuration.md#kafka)</u>

## Resources published
```
{
	metadata: metadata object expressing predator and runner versions
	event: event type
	resource: {
		test_id: test id
		report_id: report id
		job_id: job id
		test_name: test name
		description: test description
		revision_id: test revision id
		artillery_test: full artillery test object
		job_type: job type
		max_virtual_users: job max virutal users
		arrival_count: job arrival count
		arrival_rate: job arrival rate
		ramp_to: job ramp to
		parallelism: job parallelism
		start_time: job start time
		end_time: job end time
		notes: job notes
		duration: job duration
		status: report status
		intermediates: array of intermediate results split into 30 second buckets
		aggregate: object of report aggregated results
	}
}
```
### Excluding attributes of resource published
If you would like to exclude some properties published under the `resource` content,
configure the `streaming_excluded_attributes` in the configuration.