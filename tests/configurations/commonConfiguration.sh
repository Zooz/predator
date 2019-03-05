#!/usr/bin/env bash

export RUNNER_IP=127.0.0.1
export URL=$RUNNER_IP:80

export MY_ADDRESS=$URL

export MAILHOG_HOST=$RUNNER_IP
export MAILHOG_PORT=8025


export DOCKER_NAME='zooz/predator-runner:latest'
export INTERNAL_ADDRESS='http://localhost:80'k