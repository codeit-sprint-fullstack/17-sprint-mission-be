import mongoose  from "mongoose";

const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, '상품명을 입력해 주세요.'],
            trim: true
        },
        description: {
            type: String,
            required: [true, '상품 소개를 입력해 주세요.'],
            trim: true
        },
        price: {
            type: Number,
            required: [true, '판매 가격을 입력해 주세요.'], 
            min: [0, '판매 가격은 0 이상이어야 합니다.'],
            cast: '판매 가격은 숫자여야 합니다.',
        },
        tags: {type: [String], default: []},

    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                delete ret._id;
            },
        },
    },
);

const Product = mongoose.model('Product', ProductSchema);

export default Product;