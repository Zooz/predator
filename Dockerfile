# NODE container which runs this service
FROM node:16 as builder

RUN mkdir -p /usr/ui

COPY /ui /usr/ui

WORKDIR /usr/ui

# Build UI from sources
RUN npm ci --silent

ENV NODE_ENV=production
ARG BUCKET_PATH
ARG PREDATOR_DOCS_URL

RUN VERSION=$(node -p -e "require('./package.json').version") && BUCKET_PATH=$BUCKET_PATH PREDATOR_DOCS_URL=$PREDATOR_DOCS_URL VERSION=$VERSION npm run build

FROM node:16.14.2-alpine3.14 as production

# Best practice to let dump-init be the process with pid 0
RUN apk add dumb-init

RUN mkdir -p /usr/src

WORKDIR /usr

# Install app dependencies
COPY --chown=node:node package*.json /usr/
RUN npm ci --production --silent
## Bundle app source
COPY --chown=node:node /src /usr/src
COPY --chown=node:node /docs /usr/docs
COPY --chown=node:node --from=builder /usr/ui/dist /usr/ui/dist

# node images comes with a user node
USER node
CMD ["dump-init", "node", "--max_old_space_size=512", "./src/server.js" ]
