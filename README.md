# 판다마켓 · 스프린트 미션 5 BE

Express로 상품 API를 구현한 백엔드 프로젝트입니다. 상품은 MongoDB에 저장하고, Mongoose로 데이터 형식과 생성·수정 시간을 관리합니다.

## 폴더 구성

```text
.
├── src/
│   ├── server.js           # Express 실행, MongoDB 연결, 상태 확인
│   ├── products-router.js  # 상품 조회·등록·수정·삭제
│   ├── product.js          # Mongoose 상품 스키마
│   └── http-error.js       # API 오류 응답
├── .env.example            # 로컬 환경 변수 예시
├── package.json            # 서버 실행 명령과 의존성
├── compose.yaml            # 로컬 MongoDB 실행 설정
└── render.yaml             # Render 백엔드 배포 설정
```

## 로컬 실행

Node.js 22.13 이상과 MongoDB가 필요합니다. 프로젝트 루트에서 PowerShell을 열고 실행합니다.

1. 백엔드 패키지를 설치합니다.

   ```powershell
   npm ci
   ```

2. `.env`가 없으면 예제 파일을 복사합니다. Docker Desktop을 켜고 MongoDB를 실행합니다.

   ```powershell
   if (-not (Test-Path -LiteralPath .env)) {
     Copy-Item -LiteralPath .env.example -Destination .env
   }
   docker compose up -d --wait
   ```

   Docker Compose는 로컬 포트 `27018`을 사용합니다. MongoDB를 따로 실행 중이면 `.env`의 `MONGODB_URI`에 사용 중인 연결 주소를 입력하고 Compose 명령은 건너뜁니다.

3. Express 서버를 실행합니다.

   ```powershell
   npm start
   ```

   [서버 상태](http://127.0.0.1:3002/health)에서 `{"status":"ok"}`를 확인하고, [상품 목록](http://127.0.0.1:3002/api/products)을 열어 봅니다.

코드를 수정할 때 서버를 자동으로 다시 시작하려면 `npm run dev`를 사용합니다. `PORT`의 기본값은 `3002`입니다. 프론트엔드 주소가 여러 개면 `CORS_ORIGINS`에 쉼표로 구분해 넣습니다.

## 백엔드 API

| 메서드 | 경로 | 기능 | 성공 상태 |
| --- | --- | --- | --- |
| `GET` | `/api/products?offset=0&limit=10&orderBy=recent&keyword=` | 최신순 목록, 상품명·소개 검색, 페이지네이션 | `200` |
| `POST` | `/api/products` | 상품 등록 | `201` |
| `GET` | `/api/products/:id` | 상품 상세 조회 | `200` |
| `PATCH` | `/api/products/:id` | 상품 일부 수정 | `200` |
| `DELETE` | `/api/products/:id` | 상품 삭제 | `204` |
| `GET` | `/health` | MongoDB 연결 상태 확인 | `200` |

- 목록 응답은 `{ list, totalCount }`입니다. 상품이 없으면 `list`가 빈 배열입니다. 다음 10개를 보려면 `offset=10`을 사용합니다.
- 등록할 때는 `name`, `description`, `price`, `tags`를 보냅니다. 가격은 양의 정수이고 태그는 문자열 배열입니다. 태그가 없으면 `[]`를 보냅니다. 수정할 때는 바꿀 필드만 보냅니다.
- MongoDB의 `_id`는 문자열 `id`로 반환합니다. 상품 응답에 생성 시간 `createdAt`이 포함되고, 등록·수정 응답에는 수정 시간 `updatedAt`도 포함됩니다.
- 잘못된 요청은 `400`, 존재하지 않는 상품은 `404`, 32KB를 초과하는 본문은 `413`을 반환합니다. 오류 응답에는 `message`가 포함됩니다. MongoDB 연결이 끊어지면 `/health`는 `503`을 반환합니다.

### PowerShell에서 등록하고 조회하기

서버를 켠 상태에서 새 터미널에 입력합니다.

```powershell
$api = 'http://127.0.0.1:3002/api/products'
$payload = @{
  name = '캠핑 의자'
  description = '접이식 의자입니다.'
  price = 25000
  tags = @('캠핑')
} | ConvertTo-Json

$product = Invoke-RestMethod -Uri $api -Method Post -ContentType 'application/json; charset=utf-8' -Body $payload
Invoke-RestMethod -Uri "$api/$($product.id)"
```

## Render 배포

Render에서 이 백엔드 프로젝트가 있는 GitHub 저장소를 연결하고 `render.yaml`을 Blueprint로 선택합니다. Web Service의 빌드 명령은 `npm ci --omit=dev`, 시작 명령은 `npm start`입니다.

| 환경 변수 | 입력할 값 |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas의 Node.js 연결 문자열 |
| `CORS_ORIGINS` | 배포된 프론트엔드 URL. 여러 개면 쉼표로 구분 |

Atlas의 IP 액세스 목록에 Render 백엔드의 아웃바운드 IP 범위를 추가합니다. Atlas 비밀번호가 담긴 연결 문자열은 Render의 백엔드 환경 변수나 로컬 `.env`에만 입력합니다. [Render 아웃바운드 IP](https://render.com/docs/outbound-ip-addresses) · [Atlas IP 액세스 목록](https://www.mongodb.com/docs/atlas/security/ip-access-list/)

배포 후 백엔드 주소의 `/health`에서 `{"status":"ok"}`를 확인하고, `/api/products`에서 상품 목록을 조회합니다.

## 제출 체크리스트

- [x] MongoDB 상품 스키마
- [x] 상품 등록·상세 조회·부분 수정·삭제
- [x] 최신순 목록, 상품명·소개 검색, 페이지네이션
- [x] 입력 검증과 HTTP 상태 코드
- [x] 환경 변수와 CORS 설정
- [ ] Render 배포
- [ ] GitHub PR 생성
