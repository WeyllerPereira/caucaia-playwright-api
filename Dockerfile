FROM mcr.microsoft.com/playwright:v1.50.0-jammy

WORKDIR /app

COPY app/package*.json ./
RUN npm install

COPY app/ ./

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
