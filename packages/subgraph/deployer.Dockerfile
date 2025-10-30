FROM node:20

RUN mkdir /app

COPY . /app

WORKDIR /app/packages/subgraph

RUN npm ci

ENTRYPOINT [ "npm", "run", "all" ]
