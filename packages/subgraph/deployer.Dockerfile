FROM node:18.19

RUN mkdir /app

COPY . /app

WORKDIR /app/packages/subgraph

RUN npm ci

ENTRYPOINT [ "npm", "run", "all" ]