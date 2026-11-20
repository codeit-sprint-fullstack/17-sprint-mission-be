// MongoDB 연결
// - 접속 주소는 .env의 DB_CONNECT (도커 실행 시 docker-compose.yml의 값으로 덮어씀)
const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT);
    console.log("DB connected");
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
};

module.exports = dbConnect;
