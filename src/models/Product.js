import mongoose from 'mongoose';

export const PRODUCT_RULES = {
  NAME_MAX: 10,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 100,
  TAG_MAX: 5,
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '상품명을 입력해 주세요.'],
      trim: true,
      maxlength: [PRODUCT_RULES.NAME_MAX, `상품명은 ${PRODUCT_RULES.NAME_MAX}자 이내로 입력해 주세요.`],
    },
    description: {
      type: String,
      required: [true, '상품 소개를 입력해 주세요.'],
      trim: true,
      minlength: [PRODUCT_RULES.DESCRIPTION_MIN, `상품 소개는 ${PRODUCT_RULES.DESCRIPTION_MIN}자 이상 입력해 주세요.`],
      maxlength: [PRODUCT_RULES.DESCRIPTION_MAX, `상품 소개는 ${PRODUCT_RULES.DESCRIPTION_MAX}자 이내로 입력해 주세요.`],
    },
    price: {
      type: Number,
      required: [true, '판매 가격을 입력해 주세요.'],
      min: [0, '판매 가격은 0원 이상이어야 해요.'],
    },
    tags: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [PRODUCT_RULES.TAG_MAX, `태그는 ${PRODUCT_RULES.TAG_MAX}글자 이내로 입력해 주세요.`],
        },
      ],
      default: [],
    },
    favoriteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret._id;
        return ret;
      },
    },
  }
);

productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
