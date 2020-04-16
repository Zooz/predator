#!/bin/sh -e

VERSION=$(jq -r .version package.json)
V1=$(echo $VERSION | cut -d'.' -f1)
V2=$(echo $VERSION | cut -d'.' -f2)
LATEST_VERSION=$V1.$V2

echo latest version predator: $LATEST_VERSION

if [ "$CIRCLE_BRANCH" != "master" ] ; then
    export TAG=predator-$CIRCLE_BRANCH
    export IMAGE=zooz/predator-builds:$TAG
else
    export IMAGE=zooz/predator:latest
    export LATEST_TAG_IMAGE=zooz/predator:$LATEST_VERSION
fi

echo "Building Docker image $IMAGE on branch: $CIRCLE_BRANCH"

docker build -t $IMAGE .

echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin

docker push $IMAGE

if [ -n "$LATEST_TAG_IMAGE" ]; then
  echo "Building latest tag image $LATEST_TAG_IMAGE"
  docker build -t $LATEST_TAG_IMAGE .
  echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin
  docker push $LATEST_TAG_IMAGE
fi