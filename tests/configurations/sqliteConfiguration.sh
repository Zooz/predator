#!/bin/bash -e

export DATABASE_TYPE=SQLITE
export DATABASE_NAME=predator_sqlite_$( date +%T )
export DATABASE_ADDRESS=localhost
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=password
export SQLITE_STORAGE=./data.sqlite