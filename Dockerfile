# NODE container which runs this service
FROM node:12.16-slim as builder

RUN mkdir -p /usr/ui

COPY /ui /usr/ui

WORKDIR /usr/ui

# Build UI from sources
RUN npm ci --silent

ENV NODE_ENV=production
ARG BUCKET_PATH
ARG PREDATOR_DOCS_URL

RUN VERSION=$(node -p -e "require('./package.json').version") && BUCKET_PATH=$BUCKET_PATH PREDATOR_DOCS_URL=$PREDATOR_DOCS_URL VERSION=$VERSION npm run build

FROM node:12.16-slim as production

RUN mkdir -p /usr/src

WORKDIR /usr

# Install app dependencies
COPY package*.json /usr/
RUN npm ci --production --silent
## Bundle app source
COPY /src /usr/src
COPY /docs /usr/docs
COPY --from=builder /usr/ui/dist /usr/ui/dist

CMD ["node", "--max_old_space_size=512", "./src/server.js" ]
