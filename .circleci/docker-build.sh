#!/bin/sh -e

if [ "$CIRCLE_BRANCH" != "master" ] ; then
    TAG=`echo predator-$CIRCLE_BRANCH | tr -d /`
    IMAGE=zooz/predator-builds:$TAG
else
    IMAGE=zooz/predator:latest
fi

echo "Building Docker image $IMAGE on branch: $CIRCLE_BRANCH"
docker build -t $IMAGE .
echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin
docker push $IMAGE

