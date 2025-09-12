FROM node:20-alpine
WORKDIR /app

# Copiamos manifest primero para aprovechar caché
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copiamos el resto del código
COPY . .

ENV NODE_ENV=production
# Cloud Run inyecta PORT y tu server ya usa process.env.PORT
CMD ["node","server.js"]
