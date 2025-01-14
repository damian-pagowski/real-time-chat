FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma/schema.prisma prisma/
COPY . .

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]