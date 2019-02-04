#!/bin/bash
LOGS_DIRECTORY_PATH=tests/system-tests/logs

mkdir $LOGS_DIRECTORY_PATH

function waitForApp() {
    container=$1
    grepBy=$2
    HEALTH_CHECK_TIMEOUT=40;
    HEALTH_CHECK_INTERVAL=1;
    started=
    while [[ -z $started && $HEALTH_CHECK_TIMEOUT -gt 0 ]]; do
        started=$(docker logs "$container" | grep "$grepBy" 2>/dev/null)
        let HEALTH_CHECK_TIMEOUT=$HEALTH_CHECK_TIMEOUT-1
        sleep $HEALTH_CHECK_INTERVAL
    done

    if [[ -z $started ]];then
        echo "Couldn't start the application on time"
        exit 1
    fi

    docker logs -f "$container" > $LOGS_DIRECTORY_PATH/$APP.log &
}

function mysql() {
    IMAGE_NAME=mysql:5.7
    APP=mysql
    stop $APP
    COMMAND="docker run \
                    -d \
                    --name $APP \
                    -p 3306:3306 \
                    -e MYSQL_ROOT_PASSWORD=password \
                    -e MYSQL_DATABASE=predator \
                    $IMAGE_NAME"
    echo -e "Starting $APP\n"${COMMAND/\s+/ }
    $COMMAND

    COMMAND_EXIT_CODE=$?
    if [ ${COMMAND_EXIT_CODE} != 0 ]; then
        printf "Error when executing: '${APP}'\n"
        exit ${COMMAND_EXIT_CODE}
    fi

    sleep 5
    echo "$APP is ready"
}

function postgres() {
    IMAGE_NAME=postgres:11-alpine
    APP=postgres
    stop $APP
    COMMAND="docker run \
                    -d \
                    --name $APP \
                    -e POSTGRES_PASSWORD=password \
                    -e POSTGRES_USER=root \
                    --network=system-tests \
                    -p 5432:5432 \
                    $IMAGE_NAME"
    echo -e "Starting $APP\n"${COMMAND/\s+/ }
    $COMMAND

    COMMAND_EXIT_CODE=$?
    if [ ${COMMAND_EXIT_CODE} != 0 ]; then
        printf "Error when executing: '${APP}'\n"
        exit ${COMMAND_EXIT_CODE}
    fi

    waitForApp $APP "database system is ready to accept connections"
    echo "$APP is ready"
}

function cassandra() {
    IMAGE_NAME=cassandra:3.11
    APP=cassandra
    stop $APP
    COMMAND="docker run \
                    -d \
                    --name $APP \
                    -p 9042:9042 \
                    --network=system-tests \
                    $IMAGE_NAME"
    echo -e "Starting $APP\n"${COMMAND/\s+/ }
    $COMMAND
    COMMAND_EXIT_CODE=$?
    if [ ${COMMAND_EXIT_CODE} != 0 ]; then
        printf "Error when executing: '${APP}'\n"
        exit ${COMMAND_EXIT_CODE}
    fi
    waitForApp $APP "Created default superuser role 'cassandra'"
    echo "$APP is ready"
}

function mailhog() {
    IMAGE_NAME=mailhog/mailhog
    APP=mailhog
    stop $APP
    COMMAND="docker run \
                    -d \
                    --name $APP \
                    -p 8025:8025 \
                    -p 1025:1025 \
                    --network=system-tests \
                    $IMAGE_NAME"
    echo -e "Starting $APP\n"${COMMAND/\s+/ }
    $COMMAND
    COMMAND_EXIT_CODE=$?
    if [ ${COMMAND_EXIT_CODE} != 0 ]; then
        printf "Error when executing: '${APP}'\n"
        exit ${COMMAND_EXIT_CODE}
    fi
    echo "$APP is ready"
}

function reporter() {
    IMAGE_NAME=$IMAGE
    APP=reporter
    stop $APP
    COMMAND="docker run \
                    -d \
                    -e DATABASE_ADDRESS=$DATABASE_ADDRESS\
                    -e DATABASE_NAME=$DATABASE_NAME \
                    -e DATABASE_USERNAME=$DATABASE_USERNAME \
                    -e DATABASE_PASSWORD=$DATABASE_PASSWORD \
                    -e SMTP_HOST=$SMTP_HOST\
                    -e SMTP_PASSWORD=$SMTP_PASSWORD \
                    -e SMTP_USERNAME=$SMTP_USERNAME \
                    -e SMTP_PORT=$SMTP_PORT \
                    -e MY_ADDRESS=$URL \
                    -e GRAFANA_URL=$GRAFANA_URL \
                    -e REPLICATION_FACTOR=$REPLICATION_FACTOR \
                    -e DATABASE_TYPE=$DATABASE_TYPE \
                    --network=system-tests \
                    --name $APP \
                    -p 8080:8080 \
                    $IMAGE_NAME"
    echo -e "Starting $APP\n"${COMMAND/\s+/ }
    $COMMAND
    COMMAND_EXIT_CODE=$?
    if [ ${COMMAND_EXIT_CODE} != 0 ]; then
        printf "Error when executing: '${APP}'\n"
        exit ${COMMAND_EXIT_CODE}
    fi
    waitForApp $APP "App listening on port"
    echo "$APP is ready"
}

function stop() {
    NAME=$1
    isExists=$(docker ps -af name=$NAME | grep -v IMAGE)
    if [ ! -z isExists ];then
        docker rm -f $NAME
    fi
}

if [[ ! $INIT ]];then
    docker login -u gitlab-ci-token -p $CI_BUILD_TOKEN $CI_REGISTRY
    export INIT=true
fi

for option in ${@}; do
    case $option in
    postgres)
        postgres
        ;;
    cassandra)
        cassandra
        ;;
    reporter)
        reporter
        ;;
    mailhog)
        mailhog
        ;;
    mysql)
        mysql
        ;;
    stop)
        stop
        ;;
    *)
        echo "Usage: ./dockerRun.sh <cassandra|postgres|reporter|mailhog|mysql>"
        ;;
    esac
done