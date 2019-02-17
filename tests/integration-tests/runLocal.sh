#!/bin/bash -e

LOCAL_TEST=true DATABASE_TYPE=cassandra PLATFORM_TYPE=kubernetes ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=mysql PLATFORM_TYPE=kubernetes ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=sqlite PLATFORM_TYPE=kubernetes ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=postgres PLATFORM_TYPE=metronome ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=sqlite PLATFORM_TYPE=docker ./tests/integration-tests/run.sh