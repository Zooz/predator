#!/bin/bash -e

CURR_DIR=`pwd`
echo CURR_DIR is $CURR_DIR

echo initalizing global service configuration
source $CURR_DIR/tests/configurations/commonConfiguration.sh

if [ $LOCAL_TEST ]
then
    echo "Running local test"
    $CURR_DIR/tests/configurations/dockerRun.sh $DATABASE_TYPE
    $CURR_DIR/tests/configurations/dockerRun.sh mailhog
fi

echo Running integration tests with "$DATABASE_TYPE" db and "$JOB_PLATFORM" integration
source $CURR_DIR/tests/configurations/"$DATABASE_TYPE"Configuration.sh
source $CURR_DIR/tests/configurations/"$JOB_PLATFORM"Configuration.sh
export CHAOS_MESH_ENABLED=true
node_modules/.bin/_mocha $CURR_DIR/tests/integration-tests --recursive --timeout=40000 --retries=2 --exit
