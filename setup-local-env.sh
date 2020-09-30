shx echo "Starting Predator local env setup"

npm install shx
shx rm -fr ./node_modules
npm install
cd ui || exit
shx rm -fr ./node_modules
shx rm -fr dist
npm install
npm run build
cd .. || exit

node setup-env.js

shx echo "Use 'npm run-start-local' to start Predator"
