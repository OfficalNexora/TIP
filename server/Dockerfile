FROM node:22-alpine
WORKDIR /app
# Context is assumed to be the server/ directory
COPY package.json package-lock.json* ./
RUN npm install -g pnpm && pnpm install
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
# Validated build context
