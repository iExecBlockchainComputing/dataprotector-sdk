FROM node:18.19

RUN mkdir /app

COPY . /app

WORKDIR /app/packages/sharing-smart-contract

RUN npm ci

ENV XDG_CONFIG_HOME=/opt/foundry
RUN curl -L https://foundry.paradigm.xyz | bash
ENV PATH="$PATH:/opt/foundry/.foundry/bin"
RUN foundryup