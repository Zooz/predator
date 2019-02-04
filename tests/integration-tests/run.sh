#!/usr/bin/env bash -e

echo initalizing global service configuration
source ./tests/configurations/commonConfiguration.sh

echo initializing mailhog
./tests/configurations/dockerRun.sh mailhog

echo running integration tests with cassandra db and kubernetes integration
source ./tests/configurations/cassandraConfiguration.sh
source ./tests/configurations/kubernetesConfiguration.sh
./tests/configurations/dockerRun.sh cassandra
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

echo running integration tests with mysql db and kubernetes integration
source ./tests/configurations/mysqlConfiguration.sh
source ./tests/configurations/kubernetesConfiguration.sh
./tests/configurations/dockerRun.sh mysql
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

echo running integration tests with sqlite db and kubernetes integration
source ./tests/configurations/sqliteConfiguration.sh
source ./tests/configurations/kubernetesConfiguration.sh
./tests/configurations/dockerRun.sh sqlite
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

echo running integration tests with postgres db and metronome integration
source ./tests/configurations/postgresConfiguration.sh
source ./tests/configurations/metronomeConfiguration.sh
./tests/configurations/dockerRun.sh postgres
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit