FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production TZ=Asia/Baghdad DATA_DIR=/data PORT=3000
RUN apk add --no-cache tzdata
COPY package.json server.js ./
COPY src ./src
COPY public ./public
COPY tools ./tools
RUN mkdir -p /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/api/state >/dev/null || exit 1
CMD ["node", "server.js"]
