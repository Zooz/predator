#!/bin/sh -e

if [ $CIRCLE_BRANCH != "master" ] ; then
    export TAG=branches-$CIRCLE_BRANCH
else
    export TAG=latest

fi

echo "Building Docker image for tag: $TAG on branch: $CIRCLE_BRANCH"

docker build -t zooz/predator:$TAG .

echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin

docker push zooz/predator:$TAG