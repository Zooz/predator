#!/usr/bin/env bash -e

source ./scripts/metronomeConfiguration.sh

echo running integration tests with cassandra db
source ./scripts/cassandraConfiguration.sh
./scripts/dockerRun.sh cassandra
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

#echo running integration tests with mysql db
#source ./scripts/mysqlConfiguration.sh
#./scripts/dockerRun.sh mysql
#node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit
#
#echo running integration tests with postgres db
#source ./scripts/postgresConfiguration.sh
#./scripts/dockerRun.sh postgres
#node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit
#
#echo running integration tests with sqlite db
#source ./scripts/sqliteConfiguration.sh
#./scripts/dockerRun.sh postgres
#node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit
