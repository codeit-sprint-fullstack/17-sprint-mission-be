require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/dbConnect");
const productRoutes = require("./routes/productRoutes");
const { createHttpError, errorHandler } = require("./middlewares/errorHandler");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/products", productRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, "요청한 경로가 없습니다."));
});

app.use(errorHandler);

const startServer = async () => {
  await dbConnect();
  app.listen(port, () => {
    console.log(`Listening on http://127.0.0.1:${port}`);
  });
};

startServer();
