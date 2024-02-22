FROM node:18

COPY . .

RUN npm ci

ENTRYPOINT [ "npm", "run", "all" ]