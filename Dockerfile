# Build the client
FROM node:20 AS client-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Build the server
FROM node:20 AS server-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm install -g typescript
RUN tsc --project server/tsconfig.json

# Production image
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache nginx
COPY --from=client-builder /app/dist /app/dist
COPY nginx.conf /etc/nginx/nginx.conf

# Copy server files
COPY --from=server-builder /app/dist /app/dist
COPY --from=server-builder /app/package.json /app/package.json
RUN npm install -g npm@latest
RUN npm install --omit=dev

EXPOSE 80
EXPOSE 3001

CMD sh -c "nginx -g 'daemon off;' & node dist/server/index.js"
