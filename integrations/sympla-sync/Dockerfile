FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY sync.mjs run.mjs ./
USER node
CMD ["node", "run.mjs"]
