
# PandaMarket API

## 실행하기

### 도커를 통하여 실행하기

도커를 사용하면, 환경에 구애받지 않고 어플리케이션을 쉽게 개발 및 실행할 수 있습니다.

해당 장에서는 도커에 대해 자세하게 설명하지 않습니다.
자세한 사항은 [도커 공식문서](https://docs.docker.com/desktop/)를 참조해주세요.


#### 준비물

- npm
- docker
- cocker-compose

#### 실행하는 방법

```shell
npm run compose
```

docker-compose 를 통해 실행했다면, PostgreSQL 은 도커 내부에 자동적으로 만들어지고 마이그레이션과 시딩까지 실행됩니다.

아래는 자원의 접근 정보입니다.

**DB**

- `PORT` : 5432 (localhost:5432 으로 접근)
- `USER_NAME` : root
- `USER_PASSWORD` : password
- `DATABASE` : panda_market

**Service**

- `PORT` : 13000 (localhost:13000 으로 접근)


### 로컬 환경에서 실행하기

#### 준비물

- nodejs
- PostgreSQL

#### 실행 전, 필요한 작업

1. 의존성 설치 (Prisma Client 도 함께 생성됩니다)

```
npm install
```

2. `.env` 파일 작성

`.env.example` 을 참고해 PostgreSQL 접속정보를 `DATABASE_URL` 에 넣어주세요.

```
DATABASE_URL=postgresql://{userName}:{password}@{dbHost}:{dbPort}/{dbName}
```

3. 테이블 생성 (마이그레이션)

```
npm run migrate
```

4. DB Seeding (옵션)

```
npm run seed
```

5. 서비스 실행

```
npm start
```
