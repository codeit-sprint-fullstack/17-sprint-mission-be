# 04_node_prisma_blog

## 의존성 관련 명령

```shell
npm init -y
npm i express cors dotenv bcrypt superstruct morgan
npm i -E @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1
npm i -D -E prisma@7.10.1
npm i -D prettier eslint @eslint/js globals eslint-config-prettier
```

- Node.js 22.18 이상 필요 (ESLint 10, Prisma Client가 TypeScript 파일로 생성되므로 Node의 타입 제거 기능 사용)
- ESM 사용 (`package.json`의 `"type": "module"`), 상대 경로 import는 `.js` 확장자 필수

## 환경 변수 (.env)

`.env`는 git에 올리지 않으므로 clone 후 직접 생성

```
## 실행 스크립트

| 명령               | 설명                                                          |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | seed(비밀번호 암호화) 후 개발 실행 (파일 변경 시 자동 재시작) |
| `npm start`        | 배포용 실행                                                   |
| `npm run seed`     | 평문 비밀번호를 bcrypt 해시로 변경 (여러 번 실행해도 안전)    |
| `npm run db:pull`  | DB 테이블 구조를 읽어서 schema.prisma 생성                    |
| `npm run generate` | schema.prisma 기준으로 Prisma Client 생성                     |
| `npm run lint`     | ESLint 검사                                                   |
| `npm run format`   | Prettier 포맷 적용                                            |
| `npm run compose`  | 도커로 전체 실행                                              |



## 실행 방법 1 : 로컬 PostgreSQL (수동 연결)

PC에 설치된 PostgreSQL에 직접 DB를 만들고 연결하는 방법

### 1. .env 수정
```

DATABASE_URL=postgresql://사용자:비밀번호@localhost:5432/blog

````

### 2. DB 생성 + 테이블, 데이터 입력
- create database blog 통해 db 생성
- /sql의 ddl + dml 초기화 실행


### 3. 서버 실행
```shell
npm install
npm run generate
npm run dev
````

- API : http://localhost:3000/posts

### 로컬 DB 초기화

```shell
psql -U postgres -d blog -f sql/01_blog_ddl.sql
psql -U postgres -d blog -f sql/02_blog_dml.sql
npm run seed
```

- DDL에 DROP TABLE이 있어서 여러 번 실행 가능

## 실행 방법 2 : 도커

PostgreSQL 설치 없이 컨테이너로 실행하는 방법 (Windows / Mac 동일)

### 전체 실행 (DB + 서버 모두 도커)

```shell
npm run compose
ctrl + c (프로세스 종료)
```

- API : http://localhost:3000
- `npm run compose` : `docker compose build --no-cache`(precompose) -> `docker compose down` -> `docker compose up` 순서로 실행

### DB만 도커 (서버는 로컬)

```shell
docker compose up -d postgres-db
npm install
npm run generate
npm run dev
```

- .env는 기본값 그대로 사용 (`postgresql://postgres:1234@localhost:5432/blog`)

### 종료

```shell
docker compose down
```

### 도커 DB 초기화

```shell
docker compose down -v
docker compose up -d postgres-db
npm run seed
```

### 도커 명령 정리

| 명령                               | 설명                                           |
| ---------------------------------- | ---------------------------------------------- |
| `docker compose up`                | docker-compose.yml에 정의된 컨테이너 전체 실행 |
| `docker compose up -d postgres-db` | DB 컨테이너만 백그라운드(-d)로 실행            |
| `docker compose down`              | 컨테이너 종료 및 삭제 (DB 데이터는 유지)       |
| `docker compose down -v`           | 컨테이너 + 볼륨(DB 데이터)까지 삭제            |
| `docker compose build --no-cache`  | 캐시 없이 이미지 다시 빌드                     |

- sql 폴더의 파일은 볼륨이 비어있는 첫 실행 때만 자동 실행 -> 테이블 구조나 데이터를 바꿨으면 `down -v` 후 다시 실행
- 로컬에 PostgreSQL이 설치되어 있으면 5432 포트가 충돌해서 로컬 DB로 연결됨 (`"blog" 데이터베이스 없음` 에러)
  - 로컬 PostgreSQL 서비스를 중지하거나
  - docker-compose.yml의 포트를 `'5433:5432'`로, .env의 DATABASE_URL 포트를 5433으로 변경

## DB 생성 방식 (SQL 먼저 작성 -> Prisma로 가져오기)

```
sql/01_blog_ddl.sql   테이블 생성 (DDL)
sql/02_blog_dml.sql   임시 데이터 (DML)
```

1. `sql/` 폴더의 파일 실행 (로컬 : 직접 실행, 도커 : 컨테이너 첫 실행 시 이름 순서대로 자동 실행)
2. `npm run db:pull` : DB 구조를 읽어서 schema.prisma 생성
3. schema.prisma 보정 : 모델명 PascalCase + `@@map`, 필드명 camelCase + `@map`, 관계 필드명 변경
4. `npm run generate` : Prisma Client 생성 (`generated/prisma` 폴더, git에 올리지 않음)

- 테이블 구조를 바꿀 때는 sql 파일을 수정 -> DB 초기화 -> `db:pull` -> 보정 -> `generate` 순서
- migrate는 사용하지 않음

## 키워드 검색 인덱스 (pg_trgm)

게시글 검색(`title`, `content`의 `ILIKE '%검색어%'`)은 앞에 `%`가 붙어서 일반 인덱스(B-tree)를 사용할 수 없으므로 pg_trgm GIN 인덱스 사용

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX posts_title_idx ON posts USING GIN (title gin_trgm_ops);
CREATE INDEX posts_content_idx ON posts USING GIN (content gin_trgm_ops);
```

- 코드 변경 없음 : Prisma `contains` + `mode: "insensitive"`가 만드는 `ILIKE ('%' || $1 || '%')`에도 인덱스 적용
- `title OR content` 조건이므로 두 컬럼 모두 인덱스가 있어야 인덱스를 탐
- 3글자 미만 검색어(ex. 요정)는 인덱스를 사용하지 못함
- 게시글 20만 건 기준 검색 COUNT : 인덱스 없음 330ms -> 인덱스 3ms

## DataGrip 접속 정보

| 항목            | 값               |
| --------------- | ---------------- |
| Host / Port     | localhost / 5432 |
| Database        | blog             |
| User / Password | postgres / 1234  |

- 도커 DB 기준, 로컬 PostgreSQL은 본인 계정으로 접속

## 테스트 계정

test1 ~ test5 / 1234

| username | nickname     |
| -------- | ------------ |
| test1    | 코딩요정     |
| test2    | 판교개발자   |
| test3    | 버그헌터     |
| test4    | 커피는수혈   |
| test5    | 세미콜론장인 |

## API

```
GET    /users?page=1&limit=10&keyword=          사용자 목록 (조회 후 평탄화)
POST   /users/signup   { username, email, password, nickname, phone? }
POST   /users/login    { username, password }   (아이디 없음, 비밀번호 오류 모두 401)
GET    /users/:id
PATCH  /users/:id      { email?, password?, nickname?, phone? }
DELETE /users/:id      (작성한 게시글, 댓글, 좋아요도 함께 삭제 - 트랜잭션)
GET    /users/:id/likes?page=1&limit=12         좋아요한 게시글 목록

GET    /posts?page=1&limit=12&orderBy=recent&keyword=&tag=&categoryId=
       orderBy : recent, oldest, views, likes, comments
GET    /posts/:id/all      게시글 상세 1 (include 전체 - 중첩, Over-fetching)
GET    /posts/:id/select   게시글 상세 2 (select - 중첩)
GET    /posts/:id/omit     게시글 상세 3 (omit - 중첩)
GET    /posts/:id/raw      게시글 상세 4 ($queryRaw - DB에서 평탄화)
GET    /posts/:id          게시글 상세 5 (실전 : 조회 후 평탄화, 조회수 증가)
POST   /posts          { title, content, categoryId, tags?, userId }   (태그 중복 제거)
PATCH  /posts/:id      { title?, content?, categoryId?, tags? }
DELETE /posts/:id      (댓글, 좋아요도 함께 삭제 - 트랜잭션)

GET    /posts/:id/comments
POST   /posts/:id/comments   { content, userId }
PATCH  /comments/:id         { content }
DELETE /comments/:id

POST   /posts/:id/likes            { userId }   -> { likeCount }
DELETE /posts/:id/likes?userId=1               -> { likeCount }

GET    /categories      [{ id, name }]
GET    /categories/:id  { id, name, postCount, createdAt, updatedAt }
POST   /categories      { name }   (중복 이름 409)
PATCH  /categories/:id  { name }   (중복 이름 409)
DELETE /categories/:id  (게시글이 있으면 409)

GET    /tags            [{ id, name }]
GET    /tags/:id        { id, name, postCount, createdAt }
```

## 에러 응답

| 상태 | 상황                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| 400  | 요청 값 검증 실패, JSON 형식 오류, 컬럼 길이 초과(P2000)                                                    |
| 401  | 로그인 실패 (아이디 또는 비밀번호 불일치)                                                                   |
| 404  | 데이터 없음, 등록되지 않은 경로                                                                             |
| 409  | 중복된 값(P2002), 참조 중인 데이터(P2003), 이미 좋아요한 게시글, 중복 카테고리, 게시글이 있는 카테고리 삭제 |
| 500  | 기타 서버 에러                                                                                              |
