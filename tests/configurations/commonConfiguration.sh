#!/usr/bin/env bash

export RUNNER_IP=127.0.0.1
export URL=$RUNNER_IP:80

export MY_ADDRESS=$URL
export GRAFANA_URL=https://grafana.zooz.com/predator

export MAILHOG_HOST=$RUNNER_IP
export MAILHOG_PORT=8025

export SMTP_HOST=$RUNNER_IP
export SMTP_PORT=1025
export SMTP_PASSWORD=password
export SMTP_USERNAME=username
export DOCKER_NAME='zooz/predator-runner:latest'