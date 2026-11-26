# 판다마켓 미션 6 백엔드

`server/.env.example`을 참고해 `.env`에 PostgreSQL `DATABASE_URL`을 설정한다. 아래 명령은 `server/`에서 실행한다.

```sh
npm ci
npm run db:generate
npm run db:migrate
npm run seed
npm start
```

- 상품 API는 `/products`에서 기존 형식을 사용한다.
- 게시글 목록은 `/articles?offset=0&limit=10&orderBy=recent&keyword=검색어`로 조회한다.
- 상품 댓글과 게시글 댓글은 `/products/:productId/comments`, `/articles/:articleId/comments`에서 등록·조회한다. 다음 페이지는 응답의 `nextCursor`를 요청의 `cursor`에 넣는다.
- 댓글 수정·삭제는 `/comments/:commentId`의 `PATCH`와 `DELETE`를 사용한다.

테스트 전용 PostgreSQL 주소를 `TEST_DATABASE_URL`에 설정한 뒤 `npm test`를 실행한다.
