FROM node:8-alpine

ENV NPM_CONFIG_LOGLEVEL warn

COPY dist ./dist

RUN npm install -g serve@6.5.8

CMD serve --cache 0 -p $PORT0 -s dist
