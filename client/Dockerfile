# Build stage

FROM node:20-alpine AS builder

WORKDIR /app 

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install 

COPY . .
RUN pnpm run build 

# Production Stage

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 
CMD ["nginx", "-g", "daemon off;"]
