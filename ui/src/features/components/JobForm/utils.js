import { cloneDeep } from 'lodash';

export const createStateForEditJob = (job, dropdownWebhooks) => {
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
    webhooks: job.webhooks && dropdownWebhooks ? job.webhooks.map(webhook => {
      return dropdownWebhooks.find(webhookDropdown => webhookDropdown.key === webhook)
    }) : [],
    helpInfo: job.helpInfo,
    parallelism: job.parallelism,
    max_virtual_users: job.max_virtual_users,
    type: job.type,
    debug: job.debug === '*' ? true : undefined,
    notes: job.notes
  }
};

export const createJobRequest = (opts) => {
  // job_type is for rerun
  let body = {
    test_id: opts.test_id,
    type: opts.type || opts.job_type,
    debug: opts.debug ? opts.debug : undefined,
    duration: parseInt(opts.duration),
    environment: opts.environment,
    run_immediately: (opts.run_immediately === undefined) ? false : opts.run_immediately,
    emails: opts.emails,
    webhooks: opts.webhooks,
    experiments: opts.experiments,
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

  if (opts.cron_expression) { // should exist and not empty
    body.cron_expression = opts.cron_expression
  }
  body = JSON.parse(JSON.stringify(body));
  return body;
};
