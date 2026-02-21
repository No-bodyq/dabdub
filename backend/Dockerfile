FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM deps AS build
COPY . .
RUN npm run build || true

FROM node:20-bullseye-slim AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 4000
CMD ["node", "dist/main"]
