#!/bin/sh -e

if [ "$CIRCLE_BRANCH" != "master" ] ; then
    export TAG=predator-$CIRCLE_BRANCH
    export IMAGE=zooz/predator-builds:$TAG
else
    export TAG=latest
    export IMAGE=zooz/predator:$TAG
fi

echo "Building Docker image $IMAGE on branch: $CIRCLE_BRANCH"

docker build -t $IMAGE .

echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin

docker push $IMAGE