# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app
COPY client/package.json client/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY client/ .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm install tsx
COPY backend/ .
COPY --from=frontend /app/build ./public/
EXPOSE 8050
USER node
CMD ["npx", "tsx", "src/server.ts"]
