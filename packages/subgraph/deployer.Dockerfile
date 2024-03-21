FROM node:18.19

COPY . .

# ignore postinstall 
RUN npm ci --ignore-scripts 

ENTRYPOINT [ "npm", "run", "all" ]