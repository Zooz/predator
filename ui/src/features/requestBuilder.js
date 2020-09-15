export const createJobRequest = (opts) => {
    //job_type is for rerun
    let body = {
        test_id: opts.test_id,
        type: opts.type || opts.job_type,
        debug: opts.debug ? opts.debug : undefined,
        duration: parseInt(opts.duration),
        environment: opts.environment,
        run_immediately: (opts.run_immediately === undefined) ? false : opts.run_immediately,
        emails: opts.emails,
        webhooks: opts.webhooks,
        notes: opts.notes,
        parallelism: opts.parallelism ? parseInt(opts.parallelism) : undefined,
        max_virtual_users: opts.max_virtual_users ? parseInt(opts.max_virtual_users) : undefined
    };

    if (body.type === 'load_test') {
        body.ramp_to = opts.ramp_to ? parseInt(opts.ramp_to) : undefined;
        body.arrival_rate = parseInt(opts.arrival_rate);
    }

    if (body.type === 'functional_test') {
        body.arrival_count = parseInt(opts.arrival_count);
    }

    if (opts.cron_expression) {//should exist and not empty
        body.cron_expression = opts.cron_expression
    }
    body = JSON.parse(JSON.stringify(body));
    return body;
};
