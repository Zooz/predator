#!/bin/bash -e

export KAFKA_BROKERS=kafka:9092
export KAFKA_TOPIC=predator-events
export KAFKA_ALLOW_AUTO_TOPIC_CREATION=true