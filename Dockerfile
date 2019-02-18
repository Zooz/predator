# NODE container which runs this service
FROM node:8.15-alpine

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
COPY /ui/.babelrc /usr/ui

WORKDIR /usr/ui
RUN npm ci --silent

WORKDIR /usr

COPY ./entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]

