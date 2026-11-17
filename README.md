# 🐼 판다마켓 API (Express + MongoDB)

스프린트 미션 5에서 만든 판다마켓 상품 API 서버입니다. 프론트엔드는 17-sprint-mission-fe 저장소(react 브랜치)에 있어요.

## 실행 방법

```bash
npm install
cp .env.example .env   # .env를 만들고 DB_CONNECT 등을 채워 주세요
npm run dev            # 개발 모드 (파일을 저장하면 서버가 자동으로 다시 켜져요)
npm start              # 일반 실행 (render.com에서 쓰는 명령)
npm run seed           # (선택) 테스트용 상품 30개 넣기. 기존 상품은 지워져요!
```

## 환경 변수 (.env)

| 이름 | 설명 | 예시 |
|---|---|---|
| `PORT` | 서버 포트 (render.com은 자동으로 넣어 줘요) | `3000` |
| `DB_CONNECT` | MongoDB Atlas 연결 주소 | `mongodb+srv://...` |
| `CORS_ORIGIN` | 요청을 허용할 프론트엔드 주소 (쉼표로 여러 개) | `http://localhost:5173,https://내사이트.netlify.app` |

## API

| 메서드 | 경로 | 설명 | 성공 |
|---|---|---|---|
| POST | `/products` | 상품 등록 (`name`, `description`, `price`, `tags`) | 201 |
| GET | `/products` | 상품 목록 (`id`, `name`, `price`, `createdAt`) | 200 |
| GET | `/products/:id` | 상품 상세 (`id`, `name`, `description`, `price`, `tags`, `createdAt`) | 200 |
| PATCH | `/products/:id` | 상품 수정 (보낸 필드만 바뀌어요) | 200 |
| DELETE | `/products/:id` | 상품 삭제 | 204 |

### GET /products 쿼리

| 이름 | 설명 | 기본값 |
|---|---|---|
| `offset`, `limit` | offset 방식 페이지네이션 (앞에서 offset개 건너뛰고 limit개) | `0`, `10` (limit 최대 100) |
| `page`, `pageSize` | 위와 같은 offset 방식. `offset = (page - 1) * pageSize`로 바꿔서 처리 | |
| `orderBy` | `recent` (최신순) | `recent` |
| `keyword` | `name`, `description`에 포함된 단어로 검색 (대소문자 구분 없음) | |

응답: `{ "list": [...], "totalCount": 23 }`

### 에러 응답

모든 에러는 `{ "message": "..." }` 형태예요.

| 상태 코드 | 언제 |
|---|---|
| 400 | 유효성 검사 실패 (`details`에 필드별 메시지), 잘못된 ID 형식, 잘못된 JSON, 잘못된 `orderBy` |
| 404 | 상품이 없음, 없는 경로 |
| 500 | 서버 내부 오류 |

## 폴더 구조

```
├── .env.example
├── scripts/seed.js               # 테스트 데이터 넣기
└── src/
    ├── server.js                 # .env 읽기 → MongoDB 연결 → 서버 실행
    ├── app.js                    # CORS, JSON, 라우터, 에러 처리 연결
    ├── models/Product.js         # Product 스키마
    ├── routes/productRouter.js   # /products CRUD
    ├── middlewares/errorHandler.js
    └── utils/HttpError.js
```
