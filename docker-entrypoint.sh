dockerize -wait tcp://postgres-db:5432 -timeout 60s

npx prisma migrate deploy

npm run seed

npm start
