#!/usr/bin/env bash -e

echo running integration tests with cassandra db and kubernetes integration
source ./tests/configurations/commonConfiguration.sh
source ./tests/configurations/cassandraConfiguration.sh
source ./tests/configurations/kubernetesConfiguration.sh
./scripts/dockerRun.sh cassandra
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

echo running integration tests with mysql db and kubernetes integration
source ./tests/configurations/commonConfiguration.sh
source ./tests/configurations/mysqlConfiguration.sh
source ./tests/configurations/kubernetesConfiguration.sh
./scripts/dockerRun.sh mysql
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

echo running integration tests with sqlite db and kubernetes integration
source ./tests/configurations/commonConfiguration.sh
source ./scripts/sqliteConfiguration.sh
source ./tests/configurations/kubernetesConfiguration.sh
./scripts/dockerRun.sh postgres
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

echo running integration tests with sqlite db and kubernetes integration
source ./tests/configurations/commonConfiguration.sh
source ./tests/configurations/postgresConfiguration.sh
source ./tests/configurations/metronomeConfiguration.sh
node_modules/.bin/_mocha ./tests/integration-tests --recursive --timeout=20000 --exit

echo running specific integration tests with postgres db and metronome integration
source ./tests/configurations/commonConfiguration.sh
source ./tests/configurations/postgresConfiguration.sh
source ./tests/configurations/metronomeConfiguration.sh
./scripts/dockerRun.sh postgres
node_modules/.bin/_mocha ./tests/integration-tests/jobs/createJobMetronome-test.js --recursive --timeout=20000 --exit
