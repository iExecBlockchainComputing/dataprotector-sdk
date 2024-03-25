FROM node:18.19

COPY . .

# ignore postinstall 
RUN npm ci

ENTRYPOINT [ "npm", "run", "all" ]