FROM node:18

WORKDIR /app

COPY src ./src
COPY nest-cli.json ./
COPY package*.json ./
COPY tsconfig*.json ./

LABEL org.opencontainers.image.source=https://github.com/deployment-helper/apis

RUN npm install
RUN npm run build

ARG PORT=3000
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD ["npm", "run", "start:prod"]
