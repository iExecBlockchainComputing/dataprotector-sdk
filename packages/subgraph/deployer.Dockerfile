FROM node:18.19

RUN mkdir /app

COPY . /app

WORKDIR /app/packages/subgraph

RUN npm i

ENTRYPOINT [ "npm", "run", "all" ]