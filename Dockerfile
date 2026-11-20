# node 앱 빌드시 사용될 dockerfile

FROM node:22-alpine

ENV DOCKERIZE_VERSION=v0.7.0
# 인텔(amd64) / 애플실리콘(arm64) 자동 선택
ARG TARGETARCH
RUN apk update --no-cache \
    && apk add --no-cache wget openssl \
    && wget -O - https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-$TARGETARCH-$DOCKERIZE_VERSION.tar.gz | tar xzf - -C /usr/local/bin \
    && apk del wget

WORKDIR /app

EXPOSE 3000

COPY ./docker-entrypoint.sh ./docker-entrypoint.sh
RUN ["chmod", "+x", "./docker-entrypoint.sh"]
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
