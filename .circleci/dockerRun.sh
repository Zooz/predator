#!/bin/sh -e

if [ $CIRCLE_BRANCH != "master" ] ; then
    export TAG=branches-$CIRCLE_BRANCH
else
    export TAG=latest

fi

docker run -d -p 80:80 --env-file .circleci/serviceConfiguration.sh --name predator zooz/predator:$TAG