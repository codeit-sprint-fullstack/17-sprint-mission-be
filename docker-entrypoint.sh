# node app 실행시 실행될 명령어

dockerize -wait tcp://mongo-db:27017 -timeout 60s

npm install

# seed(DB 초기화) 후 개발 서버 실행
npm run dev
