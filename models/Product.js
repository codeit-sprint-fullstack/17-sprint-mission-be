import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Product = sequelize.define("Product", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(10), allowNull: false, validate: { notEmpty: true, len: [1, 10] } },
  description: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true, len: [10, 100] } },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 1 } },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING(5)),
    allowNull: false,
    defaultValue: [],
    validate: {
      isArray(value) { if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string" || tag.length > 5)) throw new Error("태그는 5자 이내의 문자열 배열이어야 합니다."); },
    },
  },
  favoriteCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "favorite_count" },
}, {
  tableName: "products",
  underscored: true,
  timestamps: true,
});
