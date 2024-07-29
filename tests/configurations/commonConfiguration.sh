#!/usr/bin/env bash

export RUNNER_IP=127.0.0.1
export URL=$RUNNER_IP:80

export MY_ADDRESS=$URL

export MAILHOG_HOST=$RUNNER_IP
export MAILHOG_PORT=8025

export SMTP_HOST=$RUNNER_IP
export SMTP_FROM='Predator 💪 <performance@predator.com>'
export SMTP_PORT=1025
export SMTP_PASSWORD=password
export SMTP_USERNAME=username
export INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS=900000   # 15 minutes
export MINIMUM_WAIT_FOR_CHAOS_EXPERIMENT_DELETION_IN_MS=720000

export INTERNAL_ADDRESS='http://localhost:80'
