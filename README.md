# 🐼 판다마켓 백엔드 · 스프린트 미션 6

> 이 저장소는 판다마켓 프로젝트의 백엔드 코드를 관리하는 곳입니다. 프로젝트를 클론하여 개발 환경을 설정하고, 각 브랜치에서 해당 스프린트 미션을 수행해 주세요! 🛠️

## 소개

안녕하세요! 판다마켓 프로젝트에 오신 것을 환영합니다! 🥳
판다마켓 백엔드는 PostgreSQL과 Express를 사용해 상품, 자유게시판 게시글, 댓글 API를 제공합니다. 🚀

![PandaMarket](https://github.com/user-attachments/assets/3784b99f-73c9-4349-a9a9-92b2a7563574)
_위 이미지는 판다마켓의 대표 이미지입니다. 프로젝트가 진행됨에 따라 더 많은 이미지를 추가할 예정이에요!_ 📸

## 스프린트 미션이란? 🤔

스프린트 미션은 **하나의 개인 프로젝트를 길게 진행하면서, 그 과정에서 주기적으로 피드백을 받을 수 있는 시스템**이에요. 각 스프린트마다 배운 이론을 적용해 보고, **멘토님께 코드 리뷰를 받아가며 실력을 쑥쑥 키워갈 수 있는 중요한 개인 과제**랍니다. 💪

## 기술 스택

- Node.js, Express
- PostgreSQL, Sequelize
- 환경 변수: `DATABASE_URL`, `PORT`, `CLIENT_ORIGIN`

서버 시작 시 Sequelize가 테이블을 생성하고, 연관 댓글에는 부모 상품 또는 게시글 삭제 시 함께 삭제되는 외래 키(`ON DELETE CASCADE`)를 설정합니다. 댓글은 DB 제약 조건으로 상품 또는 게시글 하나에만 연결됩니다. MongoDB의 기존 데이터는 자동 이전되지 않으며 `npm run seed`가 PostgreSQL에 예시 데이터를 넣습니다.

## 로컬 실행

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. `.env.example`을 `.env`로 복사한 뒤 `DATABASE_URL`을 로컬 PostgreSQL 연결 주소로 맞춥니다.

   ```powershell
   Copy-Item .env.example .env
   ```

3. 테이블과 예시 데이터를 준비합니다.

   ```bash
   npm run seed
   ```

4. API를 실행합니다.

   ```bash
   npm run dev
   ```

기본 주소는 `http://localhost:3001`이며, 상태 확인은 `/api/health`에서 할 수 있습니다.

## API

상품 목록은 기존 API와 호환되도록 `{ list, totalCount, offset, limit }` 형식으로 반환합니다. 게시글 목록도 같은 offset 페이지네이션 형식입니다. 댓글 목록은 `{ list, nextCursor, hasMore }` 형식이며, 마지막 항목의 커서를 다음 요청에 전달합니다.

| Method | Endpoint | 기능 |
| --- | --- | --- |
| `GET` | `/api/products?offset=0&limit=10&orderBy=recent&keyword=` | 상품 목록 및 이름·소개 검색 |
| `POST` | `/api/products` | 상품 등록 |
| `GET` | `/api/products/:id` | 상품 상세 조회 |
| `PATCH` | `/api/products/:id` | 상품 수정 |
| `DELETE` | `/api/products/:id` | 상품 삭제 |
| `GET` | `/api/articles?offset=0&limit=10&orderBy=recent&keyword=` | 게시글 목록 및 제목·내용 검색 |
| `POST` | `/api/articles` | 게시글 등록 (`title`, `content`) |
| `GET` | `/api/articles/:id` | 게시글 조회 |
| `PATCH` | `/api/articles/:id` | 게시글 수정 |
| `DELETE` | `/api/articles/:id` | 게시글 삭제 |
| `POST` | `/api/products/:productId/comments` | 상품 댓글 등록 (`content`) |
| `GET` | `/api/products/:productId/comments?limit=10&cursor=` | 상품 댓글 커서 목록 |
| `POST` | `/api/articles/:articleId/comments` | 게시글 댓글 등록 (`content`) |
| `GET` | `/api/articles/:articleId/comments?limit=10&cursor=` | 게시글 댓글 커서 목록 |
| `PATCH` | `/api/comments/:id` | 댓글 수정 (`content`) |
| `DELETE` | `/api/comments/:id` | 댓글 삭제 |
| `GET` | `/api/health` | API 상태 확인 |

## 프로젝트 브랜치 구조 🏗️

프로젝트는 단계별로 나뉘어 있고, 각 스프린트 미션에 맞는 브랜치가 있어요. 각 브랜치를 통해 체계적으로 개발하며 학습할 수 있어요. 🎯

### 브랜치 설명

1. **node (part1): 스프린트 미션 4~5의 BE 요구사항**
   - Express 기반 상품 API의 초기 구현을 포함합니다.

2. **express (part2~4): 후속 BE 요구사항**
   - Express.js를 이용해 더 복잡한 백엔드 기능을 구현하는 미션입니다. 데이터베이스 연동, 인증 및 권한 관리 등 고급 API 설계가 포함됩니다.
   - 후속 백엔드 내용을 담습니다.

---

본 프로젝트는 [코드잇](https://www.codeit.kr)의 소유이며, 교육 목적으로만 사용됩니다. © 2026 Codeit. All rights reserved.
