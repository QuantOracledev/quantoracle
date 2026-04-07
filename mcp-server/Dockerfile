FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY dist/ ./dist/
COPY config-schema.json ./

ENV PORT=8002
ENV BACKEND_URL=https://api.quantoracle.dev

EXPOSE 8002

CMD ["node", "dist/index.js", "--stdio"]
