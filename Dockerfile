FROM node:22-slim

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

ENV CI=1
CMD npx expo start --host lan --port ${PORT:-8081}
