# Stage 1: Build Frontend static files
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile || npm install
COPY . .
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL}
RUN pnpm build || npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
