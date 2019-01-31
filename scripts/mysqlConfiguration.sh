#!/usr/bin/env bash
echo loading mysql database configuration
export DATABASE_TYPE=MYSQL
export DATABASE_NAME=predator
export DATABASE_ADDRESS=$RUNNER_IP:3306
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=password