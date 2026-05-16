# ── Stage 1: build the React frontend ────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: production backend + bundled frontend ────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./
COPY --from=frontend-builder /app/client/dist ./public

ENV NODE_ENV=production
ENV LLM_BACKEND=vertex
ENV VERTEX_PROJECT=gemma4-workshop
ENV VERTEX_LOCATION=us-central1
ENV VERTEX_MODEL=gemma-3-4b-it
ENV PORT=8080

EXPOSE 8080
CMD ["node", "index.js"]
