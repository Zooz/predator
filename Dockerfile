# NODE container which runs this service
FROM node:8.15-alpine

RUN mkdir -p /usr/src
WORKDIR /usr
# Install app dependencies
COPY package.json /usr/

RUN apk update && \
    # Install git
    apk add --no-cache bash git openssh && \
    # Install node-gyp dependencies
    apk add --no-cache make gcc g++ python && \
    # npm install
    npm install --production --silent && \
    # Uninstall git
    apk del bash git openssh && \
    # Uninstall node-gyp dependencies
    apk del make gcc g++ python

## Bundle app source
COPY /src /usr/src
COPY /docs /usr/docs

EXPOSE 8080
CMD [ "node","--max_old_space_size=196","./src/server.js" ]