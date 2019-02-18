#!/bin/sh

set -e
cd ./ui/

if [[ -z "$EXTERNAL_ADDRESS" ]]; then
    PERFORMANCE_FRAMEWORK_API_URL=$INTERNAL_ADDRESS
else
    PERFORMANCE_FRAMEWORK_API_URL=$EXTERNAL_ADDRESS
fi

echo "API URl: $PERFORMANCE_FRAMEWORK_API_URL"
echo "Building ui code... "
PERFORMANCE_FRAMEWORK_API_URL=$PERFORMANCE_FRAMEWORK_API_URL npm run build
cd ..
echo "Starting server"
node --max_old_space_size=196 ./src/server.js