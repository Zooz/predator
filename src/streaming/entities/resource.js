class StreamingResource {
    constructor(resource) {
        // PKs
        this.test_id = resource.test_id;
        this.report_id = resource.test_id;
        this.job_id = resource.job_id;

        // test
        this.test_name = resource.test_name;
        this.description = resource.description;
        this.revision_id = resource.revision_id;
        this.artillery_test = resource.artillery_test;

        // job
        this.job_type = resource.job_type;
        this.max_virtual_users = resource.max_virtual_users;
        this.arrival_count = resource.arrival_count;
        this.arrival_rate = resource.arrival_rate;
        this.ramp_to = resource.ramp_to;
        this.parallelism = resource.parallelism;

        // report
        this.start_time = resource.start_time;
        this.end_time = resource.end_time;
        this.notes = resource.notes;
        this.duration = resource.duration;
        this.status = resource.status;
        this.intermediates = resource.intermediates;
        this.aggregate = resource.aggregate;
    }
}

module.exports = StreamingResource;