FROM node:22-slim

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

CMD npx expo start --host 0.0.0.0 --port ${PORT:-8081} --non-interactive
