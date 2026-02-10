FROM node:22-alpine
WORKDIR /app
# Context is assumed to be the root of the repo
COPY server/package.json server/pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install
COPY server/ .
EXPOSE 3000
CMD ["node", "index.js"]
