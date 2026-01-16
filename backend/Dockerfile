FROM 289208114389.dkr.ecr.us-east-1.amazonaws.com/moonlight-images/node:20.18.1-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
