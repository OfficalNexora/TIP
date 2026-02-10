FROM node:22-alpine
LABEL "language"="nodejs"
WORKDIR /app
# Build context is Repository Root
COPY server/package.json server/package-lock.json* ./
RUN npm install -g pnpm && pnpm install
# Copy all backend source code from server/ directory to /app
COPY server/ .
EXPOSE 3000
CMD ["node", "index.js"]
