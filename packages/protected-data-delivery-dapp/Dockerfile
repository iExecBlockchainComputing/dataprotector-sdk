FROM node:14-alpine3.11 as builder

WORKDIR /app
COPY . .
RUN npm ci && \
    npm run build

FROM node:14-alpine3.11 as runner

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/build /app
ENTRYPOINT [ "node", "/app/app.js" ]
