#!/usr/bin/env bash

cat << "EOF"
 ____               _       _                ____       _
 |  _ \ _ __ ___  __| | __ _| |_ ___  _ __   / ___|  ___| |_ _   _ _ __
 | |_) | '__/ _ \/ _` |/ _` | __/ _ \| '__|  \___ \ / _ \ __| | | | '_ \
 |  __/| | |  __/ (_| | (_| | || (_) | |      ___) |  __/ |_| |_| | |_) |
 |_|   |_|  \___|\__,_|\__,_|\__\___/|_|     |____/ \___|\__|\__,_| .__/
                                                                  |_|
EOF

shx echo "Starting Predator local env setup"

npm install --no-save shx
shx rm -fr ./node_modules
npm install
cd ui || exit
shx rm -fr ./node_modules
shx rm -fr dist
npm install
npm run build
cd .. || exit

node setup-env.js

shx echo "Use npm 'run-start-local' to start Predator"
