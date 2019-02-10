#!/bin/bash -e

export DATABASE_ADDRESS=$RUNNER_IP:3306
export DATABASE_NAME=predator
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=password
export DATABASE_TYPE=MYSQL