FROM node:14-alpine3.11 as builder

WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

FROM node:14-alpine3.11 as runner

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/build build/
CMD [ "node", "build/app.js" ]
