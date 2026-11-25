import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Comment = sequelize.define("Comment", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
  productId: { type: DataTypes.INTEGER, allowNull: true, field: "product_id" },
  articleId: { type: DataTypes.INTEGER, allowNull: true, field: "article_id" },
}, {
  tableName: "comments",
  underscored: true,
  timestamps: true,
  validate: {
    hasExactlyOneParent() {
      if (Boolean(this.productId) === Boolean(this.articleId)) {
        throw new Error("댓글은 상품 또는 게시글 하나에 연결되어야 합니다.");
      }
    },
  },
});
