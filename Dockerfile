# Multi-stage build — keeps the final image small (no TypeScript/devDeps
# in production). This same image runs identically on Render, Railway,
# Fly.io, a plain VPS, or anywhere else that runs Docker — if you ever
# need to move off Render, this file is the reason it'll just work.

# ---- Build stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
