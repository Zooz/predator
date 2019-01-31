#!/usr/bin/env bash

function setRunnerIp() {
    if [[ $(uname) = "Darwin" ]];then
        export RUNNER_IP=$(ifconfig en0 | grep 'inet ' | cut -d' ' -f2)
    else
        export RUNNER_IP=$(ifconfig eth0 | grep 'inet addr:' | cut -d':' -f2 | awk '{ print $1}' )
    fi
}

setRunnerIp
export URL=$RUNNER_IP:8080

if [ -z $1 ];then
    echo "Please pass argument: cassandra or postgres"
elif [ "cassandra" == $1 ]; then
    docker network create -d bridge system-tests
    source ./scripts/commonConfiguration.sh
    source ./scripts/cassandraConfiguration.sh
    ./scripts/dockerRun.sh mailhog
    ./scripts/dockerRun.sh cassandra
    ./scripts/dockerRun.sh reporter

    echo running system tests with cassandra database
    ./node_modules/mocha/bin/mocha URL=$URL ./tests/system-tests --recursive

    docker rm -f reporter
    docker rm -f cassandra
    docker rm -f mailhog
elif [ "postgres" == $1 ]; then
    docker network create -d bridge system-tests
    source ./scripts/commonConfiguration.sh
    source ./scripts/postgresConfiguration.sh
    ./scripts/dockerRun.sh mailhog
    ./scripts/dockerRun.sh postgres
    ./scripts/dockerRun.sh reporter

    echo running system tests with postgres database
    ./node_modules/mocha/bin/mocha URL=$URL ./tests/system-tests --recursive

    docker rm -f reporter
    docker rm -f postgres
    docker rm -f mailhog
elif [ "mysql" == $1 ]; then
    docker network create -d bridge system-tests
    source ./scripts/commonConfiguration.sh
    source ./scripts/mysqlConfiguration.sh
    ./scripts/dockerRun.sh mailhog
    ./scripts/dockerRun.sh mysql
    ./scripts/dockerRun.sh reporter

    echo running system tests with mysql database
    ./node_modules/mocha/bin/mocha URL=$URL ./tests/system-tests --recursive

    docker rm -f reporter
    docker rm -f mysql
    docker rm -f mailhog
else
    echo "Unknown database $1"
fi