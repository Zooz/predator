# NODE container which runs this service
FROM node:12.16-slim

RUN mkdir -p /usr/src
WORKDIR /usr
# Install app dependencies
COPY package*.json /usr/

RUN npm ci --production --silent

## Bundle app source
COPY /src /usr/src
COPY /docs /usr/docs

COPY /ui/src /usr/ui/src
COPY /ui/config /usr/ui/config
COPY /ui/package*.json /usr/ui/
COPY /ui/tsconfig.base.json /usr/ui/
COPY /ui/tsconfig.json /usr/ui/
COPY /ui/tsconfig.declarations.json /usr/ui/
COPY /ui/.babelrc /usr/ui
ARG BUCKET_PATH
ARG PREDATOR_DOCS_URL
# Build UI from sources
WORKDIR /usr/ui
RUN npm ci --silent
RUN VERSION=$(node -p -e "require('/usr/package.json').version") && BUCKET_PATH=$BUCKET_PATH PREDATOR_DOCS_URL=$PREDATOR_DOCS_URL VERSION=$VERSION npm run build
# Clean up
RUN mv /usr/ui/dist /tmp/dist && rm -rf /usr/ui/* && mv /tmp/dist /usr/ui/dist

WORKDIR /usr

CMD [ "node","--max_old_space_size=512","./src/server.js" ]
