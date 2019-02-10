#!/bin/sh -e

export TAG=branches-$CIRCLE_BRANCH

ORGANIZATION="zooz"
IMAGE="predator"

TOKEN=`curl -s -H "Content-Type: application/json" -X POST -d '{"username": "'$DOCKERHUB_USERNAME'", "password": "'$DOCKERHUB_PASSWORD'"}' https://hub.docker.com/v2/users/login/ | jq -r .token`

echo Deleting image: https://cloud.docker.com/v2/repositories/"$ORGANIZATION"/"$IMAGE"/tags/"$TAG"

curl "https://cloud.docker.com/v2/repositories/"$ORGANIZATION"/"$IMAGE"/tags/"$TAG"?force=true" \
-X DELETE \
-H "Authorization: JWT ${TOKEN}"