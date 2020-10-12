import {cloneDeep} from 'lodash';

export const createStateForEditJob = (job) => {
    job = cloneDeep(job);
    return {
        id: job.id,
        test_id: job.test_id,
        test_name: job.test_name,
        arrival_rate: job.arrival_rate,
        arrival_count: job.arrival_count,
        duration: job.duration ? job.duration / 60 : 0,
        enable_ramp_to: !!job.ramp_to,
        ramp_to: job.ramp_to,
        environment: job.environment,
        cron_expression: job.cron_expression,
        run_immediately: job.run_immediately,
        emails: job.emails ? job.emails : [],
        raw_webhooks: job.webhooks ? job.webhooks : [],
        helpInfo: job.helpInfo,
        parallelism: job.parallelism,
        max_virtual_users: job.max_virtual_users,
        type: job.type,
        debug: job.debug === '*' ? true : undefined,
        notes: job.notes
    }
};

