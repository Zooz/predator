#!/bin/bash
LOGS_DIRECTORY_PATH=tests/logs

mkdir -p $LOGS_DIRECTORY_PATH

function waitForApp() {
    container=$1
    grepBy=$2
    HEALTH_CHECK_TIMEOUT=40;
    HEALTH_CHECK_INTERVAL=1;
    started=
    while [[ -z $started && $HEALTH_CHECK_TIMEOUT -gt 0 ]]; do
        started=$(docker logs "$container" 2>&1 | grep "$grepBy" 2>/dev/null)
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
    COMMAND="docker run --platform linux/amd64\
                    -d \
                    --name mysql \
                    -p 3306:3306 \
                    -e MYSQL_ROOT_PASSWORD=password \
                    -e MYSQL_DATABASE=predator \
                    mysql:5.7"
    echo -e "Starting $APP\n"${COMMAND/\s+/ }
    $COMMAND

    COMMAND_EXIT_CODE=$?
    if [ ${COMMAND_EXIT_CODE} != 0 ]; then
        printf "Error when executing: '${APP}'\n"
        exit ${COMMAND_EXIT_CODE}
    fi

    waitForApp $APP "ready for connections"
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

function mailhog() {
    IMAGE_NAME=mailhog/mailhog
    APP=mailhog
    stop $APP
    COMMAND="docker run \
                    -d \
                    --name $APP \
                    --platform=linux/amd64 \
                    -p 8025:8025 \
                    -p 1025:1025 \
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
        echo "Usage: ./dockerRun.sh <postgres|mailhog|mysql>"
        ;;
    esac
done
