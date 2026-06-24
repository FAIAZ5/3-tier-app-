# STAGE 1: Build the React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# STAGE 2: Serve with nginx
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 8080
