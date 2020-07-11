FROM node:lts

LABEL maintainer="gitlab.com/benny"

ENV NODE_ENV=production

# Create app/src directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json /app/
RUN npm install --no-optional && npm cache clean --force

# Copy app
COPY server.js /app/

CMD npm start

EXPOSE 3000