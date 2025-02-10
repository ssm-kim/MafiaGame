# frontend/mafia/Dockerfile
# 빌드 단계
FROM node:22.13.0-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 프로덕션 단계
FROM nginx:alpine

# Nginx 설정 파일 복사 (필요한 경우)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 파일을 Nginx 서버로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]