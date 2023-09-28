FROM node:18 AS base

WORKDIR /app

COPY apps ./apps
COPY nest-cli.json ./
COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install
RUN npm run build


# ---- Release ----
FROM node:18-alpine AS release
# Create app directory
WORKDIR /app
# Install production dependencies
COPY --from=BASE /app/package*.json ./
RUN npm install --only=production
# Copy built app files
COPY --from=base /app/dist ./dist

# Expose port and define CMD

ARG PORT=3000
ENV PORT=${PORT}

EXPOSE ${PORT}
ENTRYPOINT ["npm", "run"]
CMD ["start:prod"]
