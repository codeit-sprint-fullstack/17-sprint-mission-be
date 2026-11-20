### 1. Git 환경 설정

#### GitHub 저장소 생성

프로젝트 원본 저장소를 내 계정으로 fork

- codeit-sprint-fullstack/17-sprint-mission-be -> 내계정/17-sprint-mission-be

#### project 폴더 생성

- mkdir 17-sprint-mission-be (또는 탐색기에서 생성)
- cd 17-sprint-mission-be

#### Git 로컬 환경 설정

GitHub 내 계정의 브랜치 지정하여 clone, 로컬 브랜치도 자동 지정

- git clone --branch node https://github.com/내계정/17-sprint-mission-be.git

- cd 17-sprint-mission-be
- git remote -v (원격 연동 상태 확인)
- git branch (현재 브랜치 확인)

---

### 2. node.js(express) 작업 환경 설정

#### 새 프로젝트 생성 및 의존성 설치

npm init -y (package.json 파일 생성)

npm i express
npm i mongoose
npm i bcrypt
npm i cors
npm i superstruct
npm i dotenv

#### 기본 파일 생성 1) 환경 변수 (.env) 파일 생성

.env 파일 생성 및 환경 변수 생성

```
PORT=3000
DB_CONNECT=mongodb://root:password@localhost:27017/blog?authSource=admin
```

.gitignore 파일 생성 및 .env 등록 (그 외 유사 프로젝트 참조)
package.json 파일 내 script 등록

```
  "scripts": {
    "start": "node app.js",
    <!-- "dev": "npm run seed && node --watch app.js", -->
    "dev": "node --watch app.js",
    "seed": "node seed/seed.js",
    "precompose": "docker compose build --no-cache",
    "compose": "docker compose down && docker compose up"
  }
```

#### 기본 파일 생성2) DB 연결 관련 파일 생성

config/dbConnect.js (mongoDB 연결 정보 - .env와 연결)
seed/seed.js (초기 샘플 데이트 필요 시)

#### 기본 파일 생성2) docker 설정 파일 생성 (mongodb 사용 경우)

docker-compose.yml 파일 생성 (유사 프로젝트 파일 참조 - 컨테이너명 변경 필요)
docker-entrypoint.sh 파일 생성 (유사 프로젝트 파일 참조)
Dockerfile 파일 생성 (유사 프로젝트 파일 참조)

#### 그 외 기본 파일 생성 사항 참고는 다음 블로그를 참조하세요.

[Node.js - 프로젝트 시 기본 파일 설정](https://velog.io/@4dinno/Node.js-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EC%8B%9C-%EA%B8%B0%EB%B3%B8-%ED%8C%8C%EC%9D%BC-%EC%84%A4%EC%A0%95)

---

### 3. 도커 실행(monogdb run) 및 express 파일 실행 스크립트

#### 도커 실행(도커 내리고/올리기):

npm run compose (도커 실행) - Dockerfile/docker-compose.yml/docker-entrypoint.sh 있어야함
ctrl + c (프로세스 종료)
docker compose down (도커 컴포즈 종료)

#### express 파일 실행

npm run dev (node --watch app.js : 파일 실행, 파일 변경 시 자동 재시작)

#### 테스트 데이터 초기화 (seed.js 쓰는 경우)

npm run seed (테스트 데이터 초기화, 기존 데이터 전체 삭제)

#### 기타 참고

- API1 : http://localhost:3000/users
- API2 : http://localhost:3000/posts
- DB Viewer : http://localhost:8081

### 4. 로컬 실행 (DB만 도커) - 필요 시 선택 진행

docker compose up -d mongo-db mongo-db-express
npm install
npm run seed
npm run dev

### 5. express 비즈니스 로직 작성

models → seed → structs(유효성 검증 등 쓰는 경우) → controllers → routes → middlewares/exceptions 순으로 기능 확장

#### express 프로젝트 주요 폴더 구조는 다음 블로그를 참조하세요.

[Node.js - express 프로젝트 주요 폴더 구조](https://velog.io/@4dinno/Node.js-express-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-%EC%A3%BC%EC%9A%94-%ED%8F%B4%EB%8D%94-%EA%B5%AC%EC%A1%B0)

### 6. GitHub Loading

git branch (현재 브랜치 확인) - node 이어야 함, 아니면 git switch -c node
git add . 또는 git add index.html (올릴 파일 staging)
git commit -m "Fix: App.jsx File 제작" (올릴 파일 저장)
git status (현재 상태 확인)
git push origin node (원격 저장소에 react 브랜치 생성하며 푸시)
