# Build stage

FROM node:20-alpine AS builder

WORKDIR /app 

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install 

COPY . .

ARG VITE_SERVER_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_APP_ID

RUN echo "VITE_SERVER_URL=$VITE_SERVER_URL" > .env
RUN echo "VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" >> .env
RUN echo "VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN" >> .env
RUN echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> .env
RUN echo "VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID" >> .env

RUN pnpm run build 

# Production Stage

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Changes Nginx to listen on port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

