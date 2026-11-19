import mongoose from "mongoose";

// 상품 데이터 구조 (id는 MongoDB가 자동 생성)
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true, // createdAt · updatedAt 자동 기록
    toJSON: {
      virtuals: true, // 응답에 id 포함
      versionKey: false, // 응답에서 __v 제외
      transform: (doc, ret) => {
        delete ret._id; // id와 겹치는 _id 제외
        return ret;
      },
    },
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
