# 판다마켓 백엔드 · 스프린트 미션 5

Express와 MongoDB(Mongoose)로 만든 상품 API입니다.

## 실행

1. Node.js를 설치하고 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. `.env.example`을 `.env`로 복사한 뒤 `MONGODB_URI`를 설정합니다. 실제 비밀번호가 포함된 `.env`는 GitHub에 올리지 마세요.

3. 개발 서버를 실행합니다.

   ```bash
   npm run dev
   ```

기본 주소는 `http://localhost:3001`입니다.

## API

- `GET /api/health`
- `GET /api/products?offset=0&limit=10&orderBy=recent&keyword=`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`

필요한 환경 변수는 `.env.example`에 있습니다.
