const mongoose = require('mongoose');

function hasLength(value, min, max) {
  const length = Array.from(value).length;
  return length >= min && length <= max;
}

const productSchema = new mongoose.Schema({
  name: {
    type: String, trim: true, required: true,
    validate: value => hasLength(value, 1, 10),
  },
  description: {
    type: String, trim: true, required: true,
    validate: value => hasLength(value, 10, 100),
  },
  price: {
    type: Number, required: true,
    validate: value => Number.isSafeInteger(value) && value >= 0,
  },
  tags: {
    type: [{ type: String, trim: true }],
    default: [],
    validate: values => values.every(value => typeof value === 'string' && hasLength(value, 1, 5)),
  },
}, { timestamps: true });

productSchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('Product', productSchema);
