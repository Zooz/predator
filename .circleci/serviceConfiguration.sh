#!/usr/bin/env bash

RUNNER_IP=127.0.0.1
URL=$RUNNER_IP:80

#SERVICE VARIABLES
MY_ADDRESS=$URL

#SMTP VARIABLES
SMTP_HOST=$RUNNER_IP
SMTP_PORT=1025
SMTP_PASSWORD=password
SMTP_USERNAME=username

#PLATFORM VARIABLES
JOB_PLATFORM=KUBERNETES
KUBERNETES_URL=https://kubernetes
KUBERNETES_TOKEN=ya29.some-token
KUBERNETES_NAMESPACE=default

#DATABASE VARIABLES
DATABASE_TYPE=SQLITE
DATABASE_NAME=predator
DATABASE_ADDRESS=localhost
DATABASE_USERNAME=root
DATABASE_PASSWORD=password
SQLITE_STORAGE=./data.sqlite