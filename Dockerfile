FROM node:6

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD . .
RUN npm install && \
  npm cache clean && \
  npm run build && \
  npm unbuild node_modules/*

CMD [ "npm", "start" ]

EXPOSE 3000
