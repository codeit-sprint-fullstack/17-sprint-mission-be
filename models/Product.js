import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minLength: 1,
            maxLength: 10,
        },
        description: {
            type: String,
            required: true,
            minLength: 10,
            maxLength: 100,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        tags: {
            type: [{ type: String, maxLength: 5 }],
            default: [],
        },
        favoriteCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (doc, ret) => {
                const { _id, __v, ...rest } = ret;
                return { id: _id.toString(), ...rest };
            },
        },
    },
);

export const Product = mongoose.model('Product', productSchema);
