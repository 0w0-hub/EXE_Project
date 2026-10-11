# ============================================================
# Homely — Unified Full-Stack Dockerfile for Render
# Runs React (Vite) via Nginx and Spring Boot (Java 21 + SQLite)
# All-in-One: 1 single free Web Service container on Render.
# ============================================================

# ---- Stage 1: Build Frontend ----
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

COPY frontend/ ./
ENV VITE_API_BASE_URL=/api/v1
ENV VITE_MOCK_AUTH=false
RUN npm run build

# ---- Stage 2: Build Backend ----
FROM maven:3.9-eclipse-temurin-21 AS backend-builder
WORKDIR /app/backend

COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline

COPY backend/src ./src
COPY backend/data ./data
RUN mvn -B -q clean package -DskipTests

# ---- Stage 3: Runtime Container ----
FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache nginx gettext bash curl

WORKDIR /app

# Copy built frontend assets to Nginx html directory
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy built backend jar & initial database
COPY --from=backend-builder /app/backend/target/homely-backend.jar /app/app.jar
COPY --from=backend-builder /app/backend/data /app/data

# Ensure data and uploads directories have full write permissions
RUN mkdir -p /app/uploads /app/data && chmod -R 777 /app/uploads /app/data

# Copy Nginx template and entrypoint script
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Environment variables
ENV PORT=8080
ENV UPLOAD_DIR=/app/uploads
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
