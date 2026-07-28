#!/bin/sh -e

if [ "$CIRCLE_BRANCH" != "master" ] ; then
    TAG=`echo predator-$CIRCLE_BRANCH | tr -d /`
    IMAGE=zooz/predator-builds:$TAG
else
    IMAGE=zooz/predator:latest
fi

PLATFORMS=${PLATFORMS:-linux/amd64,linux/arm64}

echo "Building Docker image $IMAGE for $PLATFORMS on branch: $CIRCLE_BRANCH"
echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin

# buildx publishes one multi-arch manifest, so the same tag runs on x86 and arm64 hosts
docker buildx create --use --name predator-builder 2>/dev/null || docker buildx use predator-builder
docker buildx build --platform "$PLATFORMS" -t $IMAGE --push .
