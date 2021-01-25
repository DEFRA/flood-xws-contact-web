FROM node:12-alpine

# Need to add bash so sass build can happen 
# Need to add git as package.json has some github refs
RUN apk add --no-cache bash git

# Install wait-on so app start can be delayed until db is initialised
RUN npm install -g wait-on

WORKDIR /usr/src/app
RUN chown node:node /usr/src/app

USER node

COPY --chown=node:node package*.json index.js ./
COPY --chown=node:node bin ./bin/
COPY --chown=node:node client ./client/
ENV NODE_ENV=development
RUN npm install
RUN npm run build
# COPY --chown=node:node . .
COPY --chown=node:node server ./server/
COPY --chown=node:node test ./test/

CMD [ "node", "index" ]

