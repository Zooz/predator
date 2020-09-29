#!/bin/sh -e

TAG=$(node -p "require('./package.json').version")
V1=$(echo $TAG | cut -d'.' -f1)
V2=$(echo $TAG | cut -d'.' -f2)
LATEST_MINOR_TAG=$V1.$V2

echo tagging version: $LATEST_MINOR_TAG
LATEST_MINOR_TAG_IMAGE=zooz/predator:$LATEST_MINOR_TAG
CONTAINER_IMAGE=zooz/predator:$TAG

echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin

docker build . -t $LATEST_MINOR_TAG_IMAGE
docker push $LATEST_MINOR_TAG_IMAGE
