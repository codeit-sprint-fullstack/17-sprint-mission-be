BEGIN;


CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" INTEGER,
    "articleId" INTEGER,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeedVersion" (
    "version" TEXT NOT NULL,

    CONSTRAINT "SeedVersion_pkey" PRIMARY KEY ("version")
);

CREATE INDEX "Product_createdAt_id_idx" ON "Product"("createdAt", "id");

CREATE INDEX "Article_createdAt_id_idx" ON "Article"("createdAt", "id");

CREATE INDEX "Comment_productId_id_idx" ON "Comment"("productId", "id");

CREATE INDEX "Comment_articleId_id_idx" ON "Comment"("articleId", "id");

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 댓글 대상은 상품 또는 게시글 중 하나
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_exactly_one_parent"
  CHECK (num_nonnulls("productId", "articleId") = 1);

ALTER TABLE "Product" ADD CONSTRAINT "Product_nonnegative_price" CHECK ("price" >= 0);
COMMIT;
