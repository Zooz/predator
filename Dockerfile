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
RUN BUCKET_PATH=$BUCKET_PATH PREDATOR_DOCS_URL=$PREDATOR_DOCS_URL npm run build
# Clean up
RUN rm -r /usr/ui

WORKDIR /usr

CMD [ "node","--max_old_space_size=512","./src/server.js" ]
