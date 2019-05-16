
export const createJobRequest = (opts) => {
    let body = {
        test_id: opts.test_id,
        arrival_rate: parseInt(opts.arrival_rate),
        duration: parseInt(opts.duration),
        ramp_to: opts.ramp_to ? parseInt(opts.ramp_to) : undefined,
        environment: opts.environment,
        run_immediately: (opts.run_immediately === undefined) ? false : opts.run_immediately,
        emails: opts.emails,
        webhooks: opts.webhooks,
        notes: opts.notes,
        parallelism: opts.parallelism ? parseInt(opts.parallelism) : undefined,
        max_virtual_users: opts.max_virtual_users ? parseInt(opts.max_virtual_users) : undefined
    };
    if (opts.cron_expression) {//should exist and not empty
        body.cron_expression = opts.cron_expression
    }
    body = JSON.parse(JSON.stringify(body));
    return body;
};