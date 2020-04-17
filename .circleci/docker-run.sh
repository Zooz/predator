#!/bin/sh -e

if [ "$CIRCLE_BRANCH" != "master" ] ; then
    export TAG=predator-$CIRCLE_BRANCH
    export IMAGE=zooz/predator-builds:$TAG
else
    export TAG=latest
    export IMAGE=zooz/predator:$TAG
fi

docker run -d -p 80:80 --env-file .circleci/service-configuration.sh --name predator $IMAGE