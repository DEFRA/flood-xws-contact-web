FROM node:12-alpine

# Need to add bash so sass build can happen 
# Need to add git as package.json has some github refs
RUN apk add --no-cache bash git

# Install wait-on so app start can be delayed until db is initialised
# Install nodemon for restart on file change
RUN npm install -g wait-on nodemon

WORKDIR /usr/src/app

ENV NODE_ENV=development

COPY --chown=node:node package.json package-lock.json ./
RUN npm install
COPY --chown=node:node bin ./bin/
# be specific about files to copy to prevent no required and/or risky files from being copied
# e.g. git, github, cloudfoundry files
COPY --chown=node:node server ./server/
COPY --chown=node:node test ./test/
COPY --chown=node:node client ./client/
COPY --chown=node:node index.js ./

RUN mkdir reports; chown node:node reports

RUN npm run build

USER node


CMD [ "npm", "start" ]

