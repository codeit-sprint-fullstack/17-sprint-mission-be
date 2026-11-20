const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "상품명은 필수입니다."],
      trim: true,
      maxlength: [100, "상품명은 100자 이하로 입력해주세요."],
    },
    description: {
      type: String,
      required: [true, "상품 소개는 필수입니다."],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "판매가격은 필수입니다."],
      min: [0, "판매가격은 0원 이상이어야 합니다."],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
