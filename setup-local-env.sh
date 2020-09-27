#!/usr/bin/env bash

cat << "EOF"
 ____               _       _                ____       _
 |  _ \ _ __ ___  __| | __ _| |_ ___  _ __   / ___|  ___| |_ _   _ _ __
 | |_) | '__/ _ \/ _` |/ _` | __/ _ \| '__|  \___ \ / _ \ __| | | | '_ \
 |  __/| | |  __/ (_| | (_| | || (_) | |      ___) |  __/ |_| |_| | |_) |
 |_|   |_|  \___|\__,_|\__,_|\__\___/|_|     |____/ \___|\__|\__,_| .__/
                                                                  |_|
EOF

rm -fr ./node_modules
npm install

cd ui || exit
rm -fr dist
rm -fr ./node_modules
npm ci
npm run build
cd ..


DATABASE_TYPE=SQLITE
INTERNAL_ADDRESS=http://$(ifconfig en0 | grep 'inet ' | cut -d' ' -f2)/v1
JOB_PLATFORM=DOCKER

touch .env

echo 'updating .env file'
sed -i '' '/DATABASE_TYPE/d' .env
sed -i '' '/INTERNAL_ADDRESS/d' .env
sed -i '' '/JOB_PLATFORM/d' .env
echo "DATABASE_TYPE=$DATABASE_TYPE" >> .env
echo "INTERNAL_ADDRESS=$INTERNAL_ADDRESS" >> .env
echo "JOB_PLATFORM=$JOB_PLATFORM" >> .env
