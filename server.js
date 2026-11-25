require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("서버 연결 성공");
});

app.get("/products", async (req, res, next) => {
  const {
    offset = "0",
    limit = "10",
    keyword = "",
    orderBy = "recent",
  } = req.query;

  const skip = Number(offset);
  const size = Number(limit);

  if (
    typeof offset !== "string" ||
    !/^\d+$/.test(offset) ||
    !Number.isSafeInteger(skip) ||
    typeof limit !== "string" ||
    !/^\d+$/.test(limit) ||
    size < 1 ||
    size > 100 ||
    typeof keyword !== "string" ||
    orderBy !== "recent"
  ) {
    return res
      .status(400)
      .json({ message: "검색 또는 페이지 설정을 확인해 주세요." });
  }

  const search = keyword.trim();
  const filter = `
    WHERE strpos(lower(name), lower($1)) > 0
       OR strpos(lower(description), lower($1)) > 0
  `;

  try {
    const [products, count] = await Promise.all([
      db.query(
        `SELECT id, name, price, created_at AS "createdAt"
         FROM products
         ${filter}
         ORDER BY created_at DESC, id DESC
         LIMIT $2 OFFSET $3`,
        [search, size, skip],
      ),
      db.query(`SELECT count(*) AS total FROM products ${filter}`, [search]),
    ]);

    res.json({
      list: products.rows,
      totalCount: Number(count.rows[0].total),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/products", async (req, res, next) => {
  const { name, description, price, tags = [] } = req.body ?? {};

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof description !== "string" ||
    !description.trim() ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Array.isArray(tags) ||
    tags.some((tag) => typeof tag !== "string")
  ) {
    return res.status(400).json({ message: "상품 정보를 확인해 주세요." });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO products (name, description, price, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name`,
      [name.trim(), description.trim(), price, tags],
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/products/:id", async (req, res, next) => {
  const { id } = req.params;
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ message: "상품 번호가 올바르지 않습니다." });
  }

  try {
    const { rows } = await db.query(
      `SELECT id, name, description, price, tags, created_at AS "createdAt"
       FROM products
       WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/products/:id", async (req, res, next) => {
  const { id } = req.params;
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ message: "상품 번호가 올바르지 않습니다." });
  }

  const body = req.body ?? {};
  const fields = ["name", "description", "price", "tags"].filter((field) =>
    Object.hasOwn(body, field),
  );

  if (fields.length === 0) {
    return res
      .status(400)
      .json({ message: "수정할 상품 정보를 입력해 주세요." });
  }

  const validators = {
    name: (value) => typeof value === "string" && value.trim() !== "",
    description: (value) => typeof value === "string" && value.trim() !== "",
    price: (value) => Number.isFinite(value) && value >= 0,
    tags: (value) =>
      Array.isArray(value) && value.every((tag) => typeof tag === "string"),
  };

  if (fields.some((field) => !validators[field](body[field]))) {
    return res.status(400).json({ message: "상품 정보를 확인해 주세요." });
  }

  const assignments = fields.map((field, index) => `${field} = $${index + 1}`);
  const values = fields.map((field) =>
    typeof body[field] === "string" ? body[field].trim() : body[field],
  );

  try {
    const { rows } = await db.query(
      `UPDATE products
       SET ${assignments.join(", ")}, updated_at = now()
       WHERE id = $${values.length + 1}
       RETURNING id, name, price`,
      [...values, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/products/:id", async (req, res, next) => {
  const { id } = req.params;
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ message: "상품 번호가 올바르지 않습니다." });
  }

  try {
    const { rowCount } = await db.query("DELETE FROM products WHERE id = $1", [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "상품을 찾을 수 없습니다." });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/articles", async (req, res, next) => {
  const { title, content } = req.body ?? {};

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof content !== "string" ||
    !content.trim()
  ) {
    return res.status(400).json({ message: "제목과 내용을 입력해 주세요." });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO articles (title, content)
       VALUES ($1, $2)
       RETURNING id, title, content, created_at AS "createdAt"`,
      [title.trim(), content.trim()],
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/articles/:id", async (req, res, next) => {
  const { id } = req.params;
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res
      .status(400)
      .json({ message: "게시글 번호가 올바르지 않습니다." });
  }

  try {
    const { rows } = await db.query(
      `SELECT id, title, content, created_at AS "createdAt"
       FROM articles
       WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.patch("/articles/:id", async (req, res, next) => {
  const { id } = req.params;
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res
      .status(400)
      .json({ message: "게시글 번호가 올바르지 않습니다." });
  }

  const { title, content } = req.body ?? {};

  const invalidText = (value) =>
    value !== undefined && (typeof value !== "string" || !value.trim());

  if (
    (title === undefined && content === undefined) ||
    invalidText(title) ||
    invalidText(content)
  ) {
    return res
      .status(400)
      .json({ message: "수정할 제목이나 내용을 확인해 주세요." });
  }

  try {
    const { rows } = await db.query(
      `UPDATE articles
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           updated_at = now()
       WHERE id = $3
       RETURNING id, title, content, created_at AS "createdAt"`,
      [title?.trim() ?? null, content?.trim() ?? null, id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/articles/:id", async (req, res, next) => {
  const { id } = req.params;
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res
      .status(400)
      .json({ message: "게시글 번호가 올바르지 않습니다." });
  }

  try {
    const { rowCount } = await db.query("DELETE FROM articles WHERE id = $1", [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/articles", async (req, res, next) => {
  const {
    offset = "0",
    limit = "10",
    keyword = "",
    orderBy = "recent",
  } = req.query;

  const skip = Number(offset);
  const size = Number(limit);

  if (
    typeof offset !== "string" ||
    !/^\d+$/.test(offset) ||
    !Number.isSafeInteger(skip) ||
    typeof limit !== "string" ||
    !/^\d+$/.test(limit) ||
    size < 1 ||
    size > 100 ||
    typeof keyword !== "string" ||
    orderBy !== "recent"
  ) {
    return res
      .status(400)
      .json({ message: "검색 또는 페이지 설정을 확인해 주세요." });
  }

  const search = keyword.trim();
  const filter = `
    WHERE strpos(lower(title), lower($1)) > 0
       OR strpos(lower(content), lower($1)) > 0
  `;

  try {
    const [articles, count] = await Promise.all([
      db.query(
        `SELECT id, title, content, created_at AS "createdAt"
         FROM articles
         ${filter}
         ORDER BY created_at DESC, id DESC
         LIMIT $2 OFFSET $3`,
        [search, size, skip],
      ),
      db.query(`SELECT count(*) AS total FROM articles ${filter}`, [search]),
    ]);

    res.json({
      list: articles.rows,
      totalCount: Number(count.rows[0].total),
    });
  } catch (error) {
    next(error);
  }
});

function createComment(parentTable, parentColumn) {
  return async (req, res, next) => {
    const { id } = req.params;
    const { content } = req.body ?? {};
    const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(id)) {
      return res
        .status(400)
        .json({ message: "상품 또는 게시글 번호가 올바르지 않습니다." });
    }

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "댓글 내용을 입력해 주세요." });
    }

    try {
      const { rows } = await db.query(
        `INSERT INTO comments (content, ${parentColumn})
         SELECT $1, id FROM ${parentTable} WHERE id = $2
         RETURNING id, content, created_at AS "createdAt"`,
        [content.trim(), id],
      );

      if (rows.length === 0) {
        return res
          .status(404)
          .json({ message: "상품 또는 게시글을 찾을 수 없습니다." });
      }

      res.status(201).json(rows[0]);
    } catch (error) {
      if (error.code === "23503") {
        return res
          .status(404)
          .json({ message: "상품 또는 게시글을 찾을 수 없습니다." });
      }
      next(error);
    }
  };
}

app.post("/products/:id/comments", createComment("products", "product_id"));
app.post("/articles/:id/comments", createComment("articles", "article_id"));

function listComments(parentTable, parentColumn) {
  return async (req, res, next) => {
    const { id } = req.params;
    const { limit = "10", cursor } = req.query;
    const size = Number(limit);
    const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
    const cursorParts = typeof cursor === "string" ? cursor.split("_") : [];
    const [cursorTime, cursorId] = cursorParts;

    if (
      !uuidPattern.test(id) ||
      typeof limit !== "string" ||
      !/^\d+$/.test(limit) ||
      size < 1 ||
      size > 100 ||
      (cursor !== undefined &&
        (cursorParts.length !== 2 ||
          !timestampPattern.test(cursorTime) ||
          !uuidPattern.test(cursorId)))
    ) {
      return res
        .status(400)
        .json({ message: "댓글 목록 요청을 확인해 주세요." });
    }

    try {
      const parent = await db.query(
        `SELECT id FROM ${parentTable} WHERE id = $1`,
        [id],
      );

      if (parent.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "상품 또는 게시글을 찾을 수 없습니다." });
      }

      const { rows } = await db.query(
        `SELECT id, content, created_at AS "createdAt",
                to_char(created_at AT TIME ZONE 'UTC',
                        'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "cursorTime"
         FROM comments
         WHERE ${parentColumn} = $1
           AND ($2::timestamptz IS NULL OR (created_at, id) < ($2::timestamptz, $3::uuid))
         ORDER BY created_at DESC, id DESC
         LIMIT $4`,
        [id, cursorTime ?? null, cursorId ?? null, size + 1],
      );

      const page = rows.slice(0, size);
      const last = page.at(-1);
      const nextCursor =
        rows.length > size ? `${last.cursorTime}_${last.id}` : null;

      res.json({
        list: page.map(({ id, content, createdAt }) => ({
          id,
          content,
          createdAt,
        })),
        nextCursor,
      });
    } catch (error) {
      if (error.code === "22007" || error.code === "22008") {
        return res
          .status(400)
          .json({ message: "댓글 목록 커서를 확인해 주세요." });
      }
      next(error);
    }
  };
}

app.get("/products/:id/comments", listComments("products", "product_id"));
app.get("/articles/:id/comments", listComments("articles", "article_id"));

app.patch("/comments/:id", async (req, res, next) => {
  const { id } = req.params;
  const { content } = req.body ?? {};
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ message: "댓글 번호가 올바르지 않습니다." });
  }

  if (typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ message: "댓글 내용을 입력해 주세요." });
  }

  try {
    const { rows } = await db.query(
      `UPDATE comments
       SET content = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, content, created_at AS "createdAt"`,
      [content.trim(), id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/comments/:id", async (req, res, next) => {
  const { id } = req.params;
  const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return res.status(400).json({ message: "댓글 번호가 올바르지 않습니다." });
  }

  try {
    const { rowCount } = await db.query("DELETE FROM comments WHERE id = $1", [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "요청한 주소를 찾을 수 없습니다." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ message: "요청 데이터 형식이 올바르지 않습니다." });
  }

  if (error.status === 413) {
    return res.status(413).json({ message: "요청 데이터가 너무 큽니다." });
  }

  console.error(error);
  res.status(500).json({ message: "서버에서 오류가 발생했습니다." });
});

async function startServer() {
  await db.query("SELECT 1 FROM products LIMIT 1");
  console.log("PostgreSQL 연결 성공");

  app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("서버 시작 실패:", error.message);
  process.exitCode = 1;
});
