# 판다마켓 백엔드

중고 거래 서비스 **판다마켓**의 API 서버입니다.
중고마켓 상품, 자유게시판 게시글, 댓글 API를 Express와 PostgreSQL(Prisma)로 구현했습니다.
코드잇 스프린트 미션 6의 백엔드 결과물입니다.

- 프론트엔드 저장소: https://github.com/subin1015/17-sprint-mission-fe

## 사용 기술

| 구분 | 내용 |
| --- | --- |
| 런타임 | Node.js (ES Modules) |
| 서버 | Express 5 |
| 데이터베이스 | PostgreSQL + Prisma 7 |
| 기타 | cors, dotenv, Prettier |

## 실행 방법

PostgreSQL 데이터베이스가 필요합니다. Prisma Client가 TypeScript 파일로 생성되므로 Node.js가 `.ts`를 바로 실행할 수 있어야 합니다. (Node.js 26에서 확인했습니다.)

```bash
npm install
cp .env.example .env        # 값을 채웁니다
npx prisma generate         # Prisma Client 생성
npx prisma migrate deploy   # 테이블 생성
npx prisma db seed          # 예시 데이터 입력 (선택)
npm run dev                 # 개발 서버 (파일 변경 시 자동 재시작)
```

| 명령 | 설명 |
| --- | --- |
| `npm start` | 서버 실행 |
| `npm run format` | `src`를 Prettier로 정리 |

### 환경 변수

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `PORT` | 서버 포트 (없으면 3000) | `3000` |
| `DATABASE_URL` | PostgreSQL 연결 문자열 (**저장소에 올리지 않습니다**) | `postgresql://<user>:<password>@localhost:5432/<database>` |
| `CORS_ORIGINS` | 요청을 허용할 프론트 주소, 여러 개는 쉼표로 구분 (끝에 `/`를 붙이지 않습니다) | `http://localhost:5173` |

`DATABASE_URL`이 없으면 서버가 시작하지 않고 메시지를 남기고 종료합니다.

### 시딩

`npx prisma db seed`는 상품 10개, 게시글 25개, 댓글 50개(1번 상품과 1번 게시글에 25개씩)를 넣습니다.

> ⚠️ 실행하면 상품, 게시글, 댓글의 **기존 데이터를 모두 지우고** 다시 넣습니다.

## 데이터 모델

| 모델 | 필드 |
| --- | --- |
| `Product` | `id`, `name`, `description`, `price`, `tags`, `createdAt`, `updatedAt` |
| `Article` | `id`, `title`, `content`, `createdAt`, `updatedAt` |
| `Comment` | `id`, `content`, `createdAt`, `updatedAt`, `productId`, `articleId` |

- 댓글은 상품 또는 게시글에 연결됩니다.
- 상품이나 게시글을 삭제하면 연결된 댓글도 함께 삭제됩니다. (`onDelete: Cascade`)

## API

기본 주소: `http://localhost:3000`

### 상품

| 메서드 | 경로 | 설명 | 성공 응답 |
| --- | --- | --- | --- |
| POST | `/products` | 등록 | `201` + 상품 |
| GET | `/products` | 목록 | `200` + `{ list, totalCount }` |
| GET | `/products/:id` | 상세 | `200` + `id`, `name`, `description`, `price`, `tags`, `createdAt` |
| PATCH | `/products/:id` | 수정 (보낸 필드만 변경) | `200` + 수정된 상품 |
| DELETE | `/products/:id` | 삭제 | `204` |

```http
POST /products
Content-Type: application/json

{ "name": "티셔츠", "description": "하늘색 티셔츠입니다", "price": 5000, "tags": ["티셔츠", "상의"] }
```

- `name`, `description`은 필수 문자열입니다.
- `price`는 필수이며 0 이상의 정수입니다. (`"5000"` 같은 숫자 문자열도 받습니다.)
- `tags`는 문자열 목록이고 생략하면 `[]`입니다.
- 목록의 각 항목에는 `id`, `name`, `price`, `createdAt`이 포함됩니다.

### 게시글 (자유게시판)

| 메서드 | 경로 | 설명 | 성공 응답 |
| --- | --- | --- | --- |
| POST | `/articles` | 등록 (`title`, `content` 필수) | `201` + 게시글 |
| GET | `/articles` | 목록 | `200` + `{ list, totalCount }` |
| GET | `/articles/:id` | 상세 | `200` + `id`, `title`, `content`, `createdAt` |
| PATCH | `/articles/:id` | 수정 (보낸 필드만 변경) | `200` + 수정된 게시글 |
| DELETE | `/articles/:id` | 삭제 | `204` |

- 목록의 각 항목에는 `id`, `title`, `content`, `createdAt`이 포함됩니다.

### 상품·게시글 목록의 쿼리 파라미터 (offset 페이지네이션)

| 이름 | 설명 | 기본값 |
| --- | --- | --- |
| `page` | 페이지 번호 (1 이상의 정수) | `1` |
| `pageSize` | 한 페이지의 개수 (1 이상 100 이하의 정수) | `10` |
| `keyword` | 포함된 단어로 검색, 대소문자 구분 없음 (상품: `name`·`description`, 게시글: `title`·`content`) | 없음 |

최신순(`createdAt` 내림차순)으로 정렬합니다.

### 댓글

| 메서드 | 경로 | 설명 | 성공 응답 |
| --- | --- | --- | --- |
| POST | `/products/:productId/comments` | 중고마켓 댓글 등록 | `201` + 댓글 |
| GET | `/products/:productId/comments` | 중고마켓 댓글 목록 | `200` + `{ list, nextCursor }` |
| POST | `/articles/:articleId/comments` | 자유게시판 댓글 등록 | `201` + 댓글 |
| GET | `/articles/:articleId/comments` | 자유게시판 댓글 목록 | `200` + `{ list, nextCursor }` |
| PATCH | `/comments/:id` | 댓글 수정 | `200` + 수정된 댓글 |
| DELETE | `/comments/:id` | 댓글 삭제 | `204` |

등록과 수정은 `{ "content": "댓글 내용" }`을 보냅니다.

목록은 cursor 페이지네이션이며 최신순입니다. 각 항목에는 `id`, `content`, `createdAt`이 포함됩니다.

| 이름 | 설명 | 기본값 |
| --- | --- | --- |
| `cursor` | 이전 응답의 `nextCursor` 값 (그다음 댓글부터 조회) | 처음부터 |
| `limit` | 가져올 개수 (1 이상 100 이하의 정수) | `10` |

```http
GET /articles/1/comments?limit=2
```

```json
{
  "list": [
    { "id": 50, "content": "게시글 댓글 25", "createdAt": "2026-11-01T01:24:00.000Z" },
    { "id": 49, "content": "게시글 댓글 24", "createdAt": "2026-11-01T01:23:00.000Z" }
  ],
  "nextCursor": 49
}
```

다음 페이지가 없으면 `nextCursor`는 `null`입니다.

## 에러 응답

모든 에러는 `{ "message": "..." }` 형식입니다.

| 상태 코드 | 경우 |
| --- | --- |
| `400` | 필수 값 누락, 값의 형식 오류, 잘못된 JSON, 사용할 수 없는 문자(NUL), 잘못된 `id`·`page`·`pageSize`·`cursor`·`limit` |
| `404` | 없는 상품·게시글·댓글, 없는 경로 |
| `413` | 요청 본문이 너무 큼 (100KB 초과) |
| `500` | 서버 내부 오류 (상세 내용은 서버 로그에만 기록) |

## 구현 포인트

- **에러 처리**: 라우트에서 던진 에러와 Prisma 에러를 에러 처리 미들웨어 한 곳에서 상태 코드와 메시지로 바꿉니다. Express 5는 async 핸들러의 에러를 자동으로 넘겨서 `try/catch`가 필요 없습니다.
- **검색**: 검색어의 `%`, `_`, `\`를 일반 글자로 바꿔서(`escapeLike`) 입력한 글자 그대로 찾습니다.
- **cursor 페이지네이션**: `id`가 cursor보다 작은 댓글을 `limit + 1`개 조회해 다음 페이지가 있는지 확인합니다.
- **CORS**: `CORS_ORIGINS`에 있는 출처만 허용합니다.

## 폴더 구조

```text
.
├── package.json
├── prisma.config.js          # DB 주소, 마이그레이션·시딩 설정
├── .env.example
├── .prettierrc
├── prisma/
│   ├── schema.prisma         # Product, Article, Comment 모델
│   ├── migrations/
│   └── seed.js               # 시딩 코드
└── src/
    ├── app.js                # 서버 설정, CORS, 라우터·에러 핸들러 등록
    ├── lib/prisma.js         # Prisma Client
    ├── routes/
    │   ├── products.js       # 상품 API
    │   ├── articles.js       # 게시글 API
    │   └── comments.js       # 댓글 API
    ├── errors/
    │   ├── NotFoundError.js      # 404 에러 클래스
    │   └── BadRequestError.js    # 400 에러 클래스
    ├── middlewares/errorHandler.js
    └── utils/
        ├── escapeLike.js     # 검색어의 특수문자 처리
        ├── pagination.js     # page·pageSize, cursor·limit 검사
        ├── parseId.js        # id 검사
        └── parseText.js      # 필수 문자열 검사
```
