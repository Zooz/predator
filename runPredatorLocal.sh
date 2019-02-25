#!/usr/bin/env bash

MACHINE_IP=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}')
docker run -d -e JOB_PLATFORM=DOCKER -e INTERNAL_ADDRESS=http://$MACHINE_IP:80/v1 -p 80:80 --name predator -v /var/run/docker.sock:/var/run/docker.sock zooz/predator