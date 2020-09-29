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

node setup-env.js
