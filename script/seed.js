import mongoose from 'mongoose'
import { Product } from '../models/Product.js'

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('환경 변수 MONGODB_URI를 확인해 주세요.')
  process.exitCode = 1
} else {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    const now = new Date()
    const result = await Product.updateOne(
      { _id: '000000000000000000000005' },
      {
        $setOnInsert: {
          name: '캠핑 의자',
          description: '접이식 캠핑 의자입니다.',
          price: 25000,
          tags: ['캠핑'],
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true, runValidators: true, timestamps: false },
    )
    console.log(result.upsertedCount ? '예시 상품을 추가했습니다.' : '예시 상품이 이미 있습니다.')
  } catch (error) {
    console.error('예시 상품을 추가하지 못했습니다.', error.code ?? error.name)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}
