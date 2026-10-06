#!/bin/bash
set -e

# Default PORT provided by Render, fallback to 8080
export PORT=${PORT:-8080}
export BACKEND_INTERNAL_PORT=8081

echo "=================================================="
echo " Starting Homely Service on Render (SQLite)"
echo " Public Port (Nginx): ${PORT}"
echo " Internal Backend Port: ${BACKEND_INTERNAL_PORT}"
echo "=================================================="

# Ensure directories exist with proper write permissions for SQLite and uploads
mkdir -p /run/nginx /var/log/nginx /etc/nginx/http.d /app/data /app/uploads
chmod -R 777 /app/data /app/uploads

# Generate Nginx configuration from template
envsubst '${PORT} ${BACKEND_INTERNAL_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/http.d/default.conf

# Start Spring Boot in background
echo "Starting Spring Boot..."
java ${JAVA_OPTS:--XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0} -Dserver.port=${BACKEND_INTERNAL_PORT} -jar /app/app.jar &
BACKEND_PID=$!

# Function to handle shutdown gracefully
cleanup() {
    echo "Shutting down..."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    nginx -s quit 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start Nginx in background
echo "Starting Nginx..."
nginx &
NGINX_PID=$!

# Wait for any process to exit
while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
    sleep 2
done

echo "Process terminated. Exiting container..."
cleanup
