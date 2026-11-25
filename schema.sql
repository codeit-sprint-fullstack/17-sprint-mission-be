CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL CHECK (btrim(description) <> ''),
  price double precision NOT NULL CHECK (price >= 0),
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (btrim(title) <> ''),
  content text NOT NULL CHECK (btrim(content) <> ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL CHECK (btrim(content) <> ''),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(product_id, article_id) = 1)
);

CREATE INDEX IF NOT EXISTS comments_product_cursor_idx
  ON comments (product_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS comments_article_cursor_idx
  ON comments (article_id, created_at DESC, id DESC);