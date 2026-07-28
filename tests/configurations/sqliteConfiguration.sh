#!/bin/bash -e

export DATABASE_TYPE=sqlite
export DATABASE_NAME=predator
export DATABASE_ADDRESS=localhost
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=password
# $$ as well as the timestamp: consecutive runs inside the same second would otherwise reuse
# a database, and suites that insert fixed-name rows then collide instead of starting clean.
export SQLITE_STORAGE=predator-$(date +%s)-$$.sqlite
