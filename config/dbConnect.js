import mongoose from "mongoose";

// MongoDB 연결 (접속 주소는 .env의 DB_CONNECT)
async function dbConnect() {
  try {
    await mongoose.connect(process.env.DB_CONNECT);
    console.log("DB 연결 성공");
  } catch (error) {
    console.error("DB 연결 실패:", error.message);
    process.exit(1); // 연결 실패 시 서버 종료 (배포 로그에서 원인을 바로 확인)
  }
}

export default dbConnect;
