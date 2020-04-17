#!/bin/sh -e

# Git config
git config --global user.email $GIT_EMAIL
git config --global user.name $GIT_USER

# Bump package.json version and tag the release
npm run release -- --release-as patch

# Retrieve tag
TAG=$(node -p "require('./package.json').version")
echo "Releasing tag: v$TAG"

echo $DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin

# Build docker and push to registry
CONTAINER_IMAGE=zooz/predator:latest
docker pull $CONTAINER_IMAGE
TAGGED_DOCKER_IMAGE=zooz/predator:$TAG
docker tag $CONTAINER_IMAGE $TAGGED_DOCKER_IMAGE
docker push $TAGGED_DOCKER_IMAGE

# Push the commit tag to gitlab
git push --follow-tags origin master