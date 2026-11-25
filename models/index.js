import { Article } from "./Article.js";
import { Comment } from "./Comment.js";
import { Product } from "./Product.js";

Product.hasMany(Comment, { as: "comments", foreignKey: "productId", onDelete: "CASCADE", hooks: true });
Comment.belongsTo(Product, { as: "product", foreignKey: "productId", onDelete: "CASCADE" });
Article.hasMany(Comment, { as: "comments", foreignKey: "articleId", onDelete: "CASCADE", hooks: true });
Comment.belongsTo(Article, { as: "article", foreignKey: "articleId", onDelete: "CASCADE" });

export { Article, Comment, Product };
