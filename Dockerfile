FROM 289208114389.dkr.ecr.us-east-1.amazonaws.com/moonlight-images/node:20.18.1-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM 289208114389.dkr.ecr.us-east-1.amazonaws.com/cache-dockerhub/library/nginx:1.27.1-alpine3.20

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
