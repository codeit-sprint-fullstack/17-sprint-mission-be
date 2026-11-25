# 판다마켓 백엔드

중고 거래 서비스 **판다마켓**의 상품 API 서버입니다.
코드잇 스프린트 미션 5의 백엔드 결과물이며, Express와 MongoDB(Mongoose)로 구현했습니다.

- 배포 주소: https://panda-market-api-subin.onrender.com
- 프론트엔드 저장소: https://github.com/subin1015/17-sprint-mission-fe

> 무료 인스턴스라서 한동안 요청이 없으면 서버가 잠들고, 첫 요청은 50초쯤 걸릴 수 있습니다.

## 사용 기술

| 구분 | 내용 |
| --- | --- |
| 런타임 | Node.js (ES Modules) |
| 서버 | Express 5 |
| 데이터베이스 | MongoDB Atlas + Mongoose 9 |
| 기타 | cors, dotenv |
| 배포 | Render |

## 실행 방법

```bash
npm install
cp .env.example .env   # 값을 채웁니다
npm run dev            # 개발 서버 (파일 변경 시 자동 재시작)
npm start              # 배포용 실행
npm run format         # Prettier로 코드 정리
```

### 환경 변수

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `PORT` | 서버 포트 (없으면 3000, 배포 환경에서는 Render가 지정) | `3000` |
| `DATABASE_URL` | MongoDB Atlas 연결 문자열 (**저장소에 올리지 않습니다**) | `mongodb+srv://<username>:<password>@<cluster>/panda-market` |
| `CORS_ORIGINS` | 요청을 허용할 프론트 주소, 여러 개는 쉼표로 구분 (끝에 `/`를 붙이지 않습니다) | `http://localhost:5173` |

`DATABASE_URL`이 없으면 서버가 시작하지 않고 메시지를 남기고 종료합니다.

## API

기본 주소: 로컬 `http://localhost:3000`, 배포 `https://panda-market-api-subin.onrender.com`

| 메서드 | 경로 | 설명 | 성공 응답 |
| --- | --- | --- | --- |
| POST | `/products` | 상품 등록 | `201` + 상품 |
| GET | `/products` | 상품 목록 | `200` + `{ list, totalCount }` |
| GET | `/products/:id` | 상품 상세 | `200` + 상품 |
| PATCH | `/products/:id` | 상품 수정 (보낸 필드만 변경) | `200` + 수정된 상품 |
| DELETE | `/products/:id` | 상품 삭제 | `204` |

### 상품 필드

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `name` | String | 상품명 (필수) |
| `description` | String | 상품 소개 (필수) |
| `price` | Number | 판매 가격 (필수, 0 이상) |
| `tags` | String[] | 태그 (기본값 `[]`) |
| `createdAt`, `updatedAt` | Date | 자동 기록 |
| `id` | String | 응답에서 `_id` 대신 사용 |

### 상품 등록

```http
POST /products
Content-Type: application/json

{ "name": "티셔츠", "description": "하늘색 티셔츠입니다", "price": 5000, "tags": ["티셔츠", "상의"] }
```

### 상품 목록

쿼리 파라미터

| 이름 | 설명 | 기본값 |
| --- | --- | --- |
| `page` | 페이지 번호 (1 이상의 정수, 잘못된 값은 400) | `1` |
| `pageSize` | 한 페이지의 개수 (1 이상 100 이하의 정수, 잘못된 값은 400) | `10` |
| `keyword` | `name`, `description`에 포함된 단어로 검색 (대소문자 구분 없음) | 없음 |

- 최신순(`createdAt` 내림차순)으로만 정렬합니다.
- 목록의 각 항목에는 `id`, `name`, `price`, `createdAt`만 포함됩니다.

```json
{
  "list": [{ "id": "…", "name": "티셔츠", "price": 5000, "createdAt": "2026-11-19T06:49:02.759Z" }],
  "totalCount": 1
}
```

### 에러 응답

모든 에러는 `{ "message": "..." }` 형식입니다.

| 상태 코드 | 경우 |
| --- | --- |
| `400` | 필수 값 누락, 가격이 숫자가 아니거나 음수, 잘못된 `id` 형식, 잘못된 `page`·`pageSize` |
| `404` | 없는 상품, 없는 경로 |
| `500` | 서버 내부 오류 (상세 내용은 서버 로그에만 기록) |

## 구현 포인트

- **에러 처리**: 라우트에서 `NotFoundError`를 던지고, 에러 처리 미들웨어 한 곳에서 상태 코드와 메시지로 바꿉니다. Express 5는 async 핸들러의 에러를 자동으로 넘겨서 `try/catch`가 필요 없습니다.
- **검색 안전성**: 검색어의 정규식 특수문자를 일반 글자로 바꿔서(`escapeRegExp`) 잘못된 검색어로 서버가 오류를 내지 않습니다.
- **CORS**: `CORS_ORIGINS`에 있는 출처만 허용합니다.
- **페이지네이션**: `page`, `pageSize`는 값이 없으면 기본값을 쓰고 잘못된 값은 400으로 알려주며, 목록과 `totalCount`를 `Promise.all`로 동시에 조회합니다.

## 폴더 구조

```text
.
├── package.json
├── .env.example
├── .prettierrc
└── src/
    ├── app.js                    # 서버 설정, CORS, 라우터·에러 핸들러 등록, DB 연결
    ├── models/Product.js         # Product 스키마
    ├── routes/products.js        # 상품 API 5개
    ├── errors/
    │   ├── NotFoundError.js      # 404 에러 클래스
    │   └── BadRequestError.js    # 400 에러 클래스
    ├── middlewares/errorHandler.js
    └── utils/
        ├── escapeRegExp.js       # 검색어의 정규식 특수문자 처리
        └── pagination.js         # page, pageSize 검사
```
