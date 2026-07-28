#!/bin/sh -e

TAG=$(node -p "require('./package.json').version")
V1=$(echo $TAG | cut -d'.' -f1)
V2=$(echo $TAG | cut -d'.' -f2)
LATEST_MINOR_TAG=$V1.$V2

echo tagging version: $LATEST_MINOR_TAG
LATEST_MINOR_TAG_IMAGE=zooz/predator:$LATEST_MINOR_TAG

PLATFORMS=${PLATFORMS:-linux/amd64,linux/arm64}

echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin

docker buildx create --use --name predator-builder 2>/dev/null || docker buildx use predator-builder
docker buildx build --platform "$PLATFORMS" -t $LATEST_MINOR_TAG_IMAGE --push .
