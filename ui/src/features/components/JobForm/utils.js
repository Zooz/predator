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

export const createJobRequest = (options) => {
  // job_type is for rerun
  const body = {
    test_id: options.test_id,
    type: options.type || options.job_type,
    debug: options.debug ? options.debug : undefined,
    duration: parseInt(options.duration),
    environment: options.environment,
    run_immediately: (options.run_immediately === undefined) ? false : options.run_immediately,
    emails: options.emails,
    webhooks: options.webhooks,
    notes: options.notes,
    parallelism: options.parallelism ? parseInt(options.parallelism) : undefined,
    max_virtual_users: options.max_virtual_users ? parseInt(options.max_virtual_users) : undefined,
    experiments: options.experiments
  };

  if (body.type === 'load_test') {
    body.ramp_to = options.ramp_to ? parseInt(options.ramp_to) : undefined;
    body.arrival_rate = parseInt(options.arrival_rate);
  }

  if (body.type === 'functional_test') {
    body.arrival_count = parseInt(options.arrival_count);
  }

  if (options.cron_expression) { // should exist and not empty
    body.cron_expression = options.cron_expression
  }

  return body;
};

export const createJobRequestFromReport = (options) => {
  // job_type is for rerun
  const body = {
    ...createJobRequest(options)
  };

  if (options.experiments) {
    body.experiments = mapExperimentsFromReportOptions(options.experiments, options.start_time);
  }

  return body;
};

function mapExperimentsFromReportOptions (experiments, startTime) {
  const testStartTime = new Date(startTime).getTime();
  const transformedExperiments = experiments.map(experiment => {
    const experimentStartTime = new Date(experiment.start_time).getTime();
    const startAfter = experimentStartTime - testStartTime;
    return {
      experiment_id: experiment.id,
      start_after: startAfter
    };
  });

  return transformedExperiments;
}
