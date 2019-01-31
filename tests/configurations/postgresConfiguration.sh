#!/usr/bin/env bash
echo loading postgres database configuration
export DATABASE_ADDRESS=$RUNNER_IP:5432
export DATABASE_NAME=postgres
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=password
export DATABASE_TYPE=POSTGRES
