# NODE container which runs this service
FROM mhart/alpine-node:15

RUN mkdir -p /usr/src
WORKDIR /usr
# Install app dependencies
COPY package*.json /usr/

RUN npm install --production

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
RUN npm install
RUN VERSION=$(node -p -e "require('/usr/package.json').version") && BUCKET_PATH=$BUCKET_PATH PREDATOR_DOCS_URL=$PREDATOR_DOCS_URL VERSION=$VERSION NODE_ENV=production npm run build
# Clean up
RUN mv /usr/ui/dist /tmp/dist && rm -rf /usr/ui/* && mv /tmp/dist /usr/ui/dist

WORKDIR /usr

CMD [ "node","--max_old_space_size=512","./src/server.js" ]
