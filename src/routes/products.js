import express from "express";
import Product from "../models/Product.js";
import NotFoundError from "../errors/NotFoundError.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, description, price, tags } = req.body;
  const product = await Product.create({ name, description, price, tags });
  res.status(201).json(product);
});

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).select(
    "name description price tags createdAt",
  );
  if (!product) throw new NotFoundError();
  res.json(product);
});

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/", async (req, res) => {
  const page = Math.max(Math.floor(Number(req.query.page)) || 1, 1);
  const pageSize = Math.min(Math.max(Math.floor(Number(req.query.pageSize)) || 10, 1), 100);
  const keyword = String(req.query.keyword ?? "").trim();

  const filter = keyword
    ? {
        $or: [
          { name: { $regex: escapeRegExp(keyword), $options: "i" } },
          { description: { $regex: escapeRegExp(keyword), $options: "i" } },
        ],
      }
    : {};

  const [list, totalCount] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select("name price createdAt"),
    Product.countDocuments(filter),
  ]);

  res.json({ list, totalCount });
});

router.patch('/:id', async (req, res) => {
    const {name, description, price, tags } = req.body;
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { name, description, price, tags },
        { returnDocument: 'after', runValidators: true },
    );
    if (!product) throw new NotFoundError();
    res.json(product);
});

router.delete('/:id', async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new NotFoundError();
    res.sendStatus(204);
});

export default router;
