#!/bin/sh -e

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)
V1=$(echo $VERSION | cut -d'.' -f1)
V2=$(echo $VERSION | cut -d'.' -f2)
LATEST_VERSION=$V1.$V2

echo tagging version: $LATEST_VERSION
LATEST_TAG_IMAGE=zooz/predator:$LATEST_VERSION

echo "Building latest tag image $LATEST_TAG_IMAGE"
docker build -t $LATEST_TAG_IMAGE .
echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin
docker push $LATEST_TAG_IMAGE