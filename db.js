import "dotenv/config";
import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && !(process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER)) {
  throw new Error("DATABASE_URL 또는 PGHOST, PGDATABASE, PGUSER 환경 변수를 설정해 주세요.");
}

export const sequelize = new Sequelize(databaseUrl ?? {
  dialect: "postgres",
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  logging: false,
}, {
  logging: false,
  pool: { max: 10, min: 0, acquire: 30_000, idle: 10_000 },
  dialectOptions: process.env.PGSSL === "true"
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

export async function syncDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
  await sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'comments_exactly_one_parent'
      ) THEN
        ALTER TABLE "comments"
        ADD CONSTRAINT comments_exactly_one_parent
        CHECK (((product_id IS NOT NULL)::integer + (article_id IS NOT NULL)::integer) = 1);
      END IF;
    END $$;
  `);
}
