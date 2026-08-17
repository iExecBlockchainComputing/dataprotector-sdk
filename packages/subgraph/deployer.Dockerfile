FROM node:22-slim

# Pull latest Debian security patches and upgrade the bundled npm,
# whose vendored dependencies (node-tar) carry known CVEs
RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@latest

COPY . /app

WORKDIR /app

RUN npm ci

ENTRYPOINT [ "npm", "run", "all" ]
