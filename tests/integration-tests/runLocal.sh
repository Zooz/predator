#!/bin/bash -e

LOCAL_TEST=true DATABASE_TYPE=cassandra JOB_PLATFORM=KUBERNETES ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=mysql JOB_PLATFORM=KUBERNETES ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=sqlite JOB_PLATFORM=KUBERNETES ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=postgres JOB_PLATFORM=METRONOME ./tests/integration-tests/run.sh
LOCAL_TEST=true DATABASE_TYPE=sqlite JOB_PLATFORM=DOCKER ./tests/integration-tests/run.sh


