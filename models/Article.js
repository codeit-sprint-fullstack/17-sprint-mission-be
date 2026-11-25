import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Article = sequelize.define("Article", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(255), allowNull: false, validate: { notEmpty: true, len: [1, 255] } },
  content: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
}, {
  tableName: "articles",
  underscored: true,
  timestamps: true,
});
