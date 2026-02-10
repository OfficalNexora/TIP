FROM node:22-alpine  
WORKDIR /app  
COPY . .  
RUN npm install -g pnpm && pnpm install  
EXPOSE 3000  
CMD ["node", "index.js"]  
