#!/bin/bash -e

export DATABASE_TYPE=sqlite
export DATABASE_NAME=predator
export DATABASE_ADDRESS=localhost
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=password
export SQLITE_STORAGE=predator-$(date +%s).sqlite
