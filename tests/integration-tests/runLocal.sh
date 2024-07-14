#!/bin/bash -e

LOCAL_TEST=true DATABASE_TYPE=mysql JOB_PLATFORM=kubernetes ./tests/integration-tests/run.sh
#LOCAL_TEST=true DATABASE_TYPE=sqlite JOB_PLATFORM=kubernetes ./tests/integration-tests/run.sh
#LOCAL_TEST=true DATABASE_TYPE=postgres JOB_PLATFORM=metronome ./tests/integration-tests/run.sh
#LOCAL_TEST=true DATABASE_TYPE=sqlite JOB_PLATFORM=docker ./tests/integration-tests/run.sh
#LOCAL_TEST=true DATABASE_TYPE=sqlite JOB_PLATFORM=awsFargate ./tests/integration-tests/run.sh
