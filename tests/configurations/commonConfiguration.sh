#!/usr/bin/env bash
function setRunnerIp() {
    if [[ $(uname) = "Darwin" ]];then
        export RUNNER_IP=127.0.0.1
    else
        export RUNNER_IP=$(ifconfig eth0 | grep 'inet addr:' | cut -d':' -f2 | awk '{ print $1}' )
    fi
}

setRunnerIp
export URL=$RUNNER_IP:8080

export MY_ADDRESS=$URL
export GRAFANA_URL=https://grafana.zooz.com/predator

export MAILHOG_HOST=$RUNNER_IP
export MAILHOG_PORT=8025

export SMTP_HOST=$RUNNER_IP
export SMTP_PORT=1025
export SMTP_PASSWORD=password
export SMTP_USERNAME=username