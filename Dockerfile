#Build stage
FROM node:20.0.0 AS builder

RUN apt-get update && apt-get install -y nano

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

#Production stage
FROM node:20.0.0

RUN apt-get update && apt-get install -y nano

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY --from=builder /app/dist ./dist

CMD ["node", "dist/server.js"]