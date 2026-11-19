# 판다마켓 백엔드 API (Sprint Mission 5)

코드잇 풀스택 17기 스프린트 미션 5입니다.
판다마켓의 **상품 API**를 Express와 MongoDB로 만들고 Render에 배포했습니다.

## 배포 주소

- API 서버: https://panda-market-be-7ke0.onrender.com
- 무료 플랜이라 한동안 요청이 없으면 서버가 잠들고, 다시 깨어날 때 첫 응답이 50초 이상 걸릴 수 있습니다.

## 실행 방법

Node.js 20.19 이상이 필요합니다 (Mongoose 9 기준).

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`의 `DB_CONNECT`에 MongoDB 접속 주소를 넣은 뒤 실행합니다. 터미널에 `DB 연결 성공`이 나오면 `http://localhost:3000`으로 접속합니다.

| 명령어          | 하는 일                                      |
| --------------- | -------------------------------------------- |
| `npm run dev`   | 개발 서버 실행 (파일을 저장하면 자동 재시작) |
| `npm run start` | 서버 실행 (배포용)                           |

### 환경 변수

| 이름         | 설명                                             |
| ------------ | ------------------------------------------------ |
| `PORT`       | 서버 포트 (기본 3000, 배포 환경에서는 자동 지정) |
| `DB_CONNECT` | MongoDB 접속 주소                                |

- 개발용 DB(`panda-market-dev`)와 배포용 DB(`panda-market`)를 나눠서 사용합니다.

## 기술 스택

- Node.js + Express 5
- MongoDB Atlas + Mongoose
- superstruct (요청 값 검사)
- cors, dotenv
- Render (배포)

## 구현 기능

### 기본 요구사항

- [x] Product 스키마 (`id`, `name`, `description`, `price`, `tags`, `createdAt`, `updatedAt`)
- [x] 상품 등록 API (`name`, `description`, `price`, `tags`를 입력해 등록)
- [x] 상품 상세 조회 API (`id`, `name`, `description`, `price`, `tags`, `createdAt` 조회)
- [x] 상품 수정 API (`PATCH` 메서드)
- [x] 상품 삭제 API
- [x] 상품 목록 조회 API (`id`, `name`, `price`, `createdAt` 조회)
  - offset 방식 페이지네이션 (`page`, `pageSize`)
  - 최신순(`recent`) 정렬
  - `name`, `description`에 포함된 단어로 검색 (`keyword`)
- [x] 각 API의 에러 처리
- [x] 각 API 응답의 상태 코드 (200, 201, 204, 400, 404, 500)
- [x] `.env` 파일로 환경 변수 설정
- [x] CORS 설정
- [x] Render 배포
- [x] MongoDB(Atlas) 사용

## 폴더 구조

```
├─ config
│  └─ dbConnect.js        # MongoDB 연결 (실패하면 서버 종료)
├─ exceptions
│  ├─ BadRequestError.js  # 400 에러
│  └─ NotFoundError.js    # 404 에러
├─ middlewares
│  └─ errorHandler.js     # 에러 종류별 상태 코드 + JSON 응답
├─ models
│  └─ product.js          # Product 스키마
├─ routes
│  └─ productRouter.js    # 상품 API 5개 (/products)
├─ structs
│  └─ product.js          # 생성·수정 요청 값 검사 규칙
├─ .env.example           # 환경 변수 예시
└─ app.js                 # 서버 실행, 미들웨어·라우터 연결
```

## 구현하면서 신경 쓴 점

- **에러 처리 한곳에 모으기:** 각 API는 에러를 던지기만 하고, `errorHandler`가 에러 종류에 맞는 상태 코드와 JSON으로 응답합니다. Express 5는 async 함수의 에러를 자동으로 넘겨 주어서 `try/catch`를 반복하지 않았습니다.
- **값 검사 규칙 재사용:** 수정 규칙은 생성 규칙에 `partial`을 적용해 만들어서, 규칙이 바뀌어도 한곳만 고치면 됩니다. 규칙은 미션의 상품 등록 유효성 검사 조건(상품명 1~10자, 상품 소개 10~100자, 태그 5글자 이내)에 맞췄습니다.
- **안전한 검색:** 검색어의 정규식 특수문자(`.`, `*`, `+` 등)를 일반 글자로 바꿔서, `.*` 같은 검색어로 전체 상품이 나오지 않도록 했습니다.
- **프론트와 같은 응답 모양:** 목록은 `{ list, totalCount }`, 상품 id는 `_id` 대신 `id`로 응답해서 미션 4 프론트의 목록 요청 코드(`getProducts`)와 `product.id` 사용 부분을 그대로 쓸 수 있게 했습니다.
- **개발용·배포용 DB 분리:** 연습하면서 만든 데이터가 배포 서버에 섞이지 않도록 DB 이름을 나눴습니다.

## API 명세

| 메서드   | 주소                   | 하는 일        | 성공 응답                   |
| -------- | ---------------------- | -------------- | --------------------------- |
| `GET`    | `/products`            | 상품 목록 조회 | 200 `{ list, totalCount }`  |
| `GET`    | `/products/:productId` | 상품 상세 조회 | 200 상품 (`updatedAt` 제외) |
| `POST`   | `/products`            | 상품 생성      | 201 생성된 상품             |
| `PATCH`  | `/products/:productId` | 상품 수정      | 200 수정된 상품             |
| `DELETE` | `/products/:productId` | 상품 삭제      | 204 (본문 없음)             |

### 목록 조회 쿼리

| 이름       | 기본값   | 설명                                                     |
| ---------- | -------- | -------------------------------------------------------- |
| `page`     | 1        | 페이지 번호 (1 이상의 정수)                              |
| `pageSize` | 10       | 한 페이지에 보여 줄 개수 (1 이상의 정수)                 |
| `orderBy`  | `recent` | 정렬 기준 (최신순만 지원해서 항상 최신순으로 정렬)       |
| `keyword`  | (없음)   | 상품명 또는 상품 설명에 포함된 단어 (대소문자 구분 없음) |

요청 예시

```
GET /products?page=1&pageSize=10&orderBy=recent&keyword=노트북
```

응답 예시

```json
{
  "list": [
    {
      "name": "노트북",
      "price": 500000,
      "createdAt": "2026-11-18T05:12:27.189Z",
      "id": "6afd33bb9990207805ee39e2"
    }
  ],
  "totalCount": 1
}
```

### 생성·수정 요청 값

| 이름          | 규칙                       | 생성                  | 수정 |
| ------------- | -------------------------- | --------------------- | ---- |
| `name`        | 1~10자 문자열              | 필수                  | 선택 |
| `description` | 10~100자 문자열            | 필수                  | 선택 |
| `price`       | 0 이상 숫자                | 필수                  | 선택 |
| `tags`        | 문자열 배열 (태그당 1~5자) | 선택 (없으면 빈 배열) | 선택 |

요청 예시

```json
{
  "name": "노트북",
  "description": "가볍고 빠른 노트북입니다",
  "price": 500000,
  "tags": ["전자", "노트북"]
}
```

- 수정은 보낸 필드만 바뀝니다.
- 위 표에 없는 필드를 보내면 400 에러를 응답합니다.

### 에러 응답

에러는 모두 `{ "message": "에러 내용" }` 형태의 JSON으로 응답합니다.

| 상태 코드 | 언제                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| 400       | 요청 값 형식이 틀림, 잘못된 상품 id 형식, 잘못된 JSON, 잘못된 `page`·`pageSize` |
| 404       | 상품이 없음, 없는 주소                                                          |
| 500       | 그 밖의 서버 오류                                                               |

## 이번 범위에 포함하지 않은 것

- 좋아요순 정렬, 상품 이미지 업로드
- 회원가입·로그인, 자유게시판 API
