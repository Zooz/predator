# NODE container which runs this service
FROM node:8.15-alpine

RUN mkdir -p /usr/src
WORKDIR /usr
# Install app dependencies
COPY package.json /usr/

RUN npm install --production --silent

## Bundle app source
COPY /src /usr/src
COPY /docs /usr/docs

CMD [ "node","--max_old_space_size=196","./src/server.js" ]