const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });

function hasValidLength(text, min, max) {
  let count = 0;
  for (const _ of segmenter.segment(text)) {
    count += 1;
    if (count > max) return false;
  }
  return count >= min;
}

export class InputError extends Error {}

export function productDetails(product) {
  const { id, name, description, price, tags, createdAt } = product;
  return { id: String(id), name, description, price, tags, createdAt };
}

export function readProduct(body, required = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InputError("상품 정보를 JSON 객체로 보내 주세요.");
  }
  const product = {};
  for (const key of ["name", "description"]) {
    if (Object.hasOwn(body, key)) {
      if (typeof body[key] !== "string") throw new InputError("상품명과 설명은 글자로 입력해 주세요.");
      product[key] = body[key].trim();
    }
  }
  if (Object.hasOwn(body, "price")) {
    if (typeof body.price === "number") product.price = body.price;
    else if (typeof body.price === "string" && /^\d+$/.test(body.price)) product.price = Number(body.price);
    else throw new InputError("가격은 0 이상의 정수로 입력해 주세요.");
  }
  if (Object.hasOwn(body, "tags")) {
    if (!Array.isArray(body.tags) || !body.tags.every((tag) => typeof tag === "string")) {
      throw new InputError("태그는 문자열 배열로 보내 주세요.");
    }
    product.tags = body.tags.map((tag) => tag.trim());
  }
  if (Object.keys(product).length === 0) throw new InputError("입력할 상품 정보가 없습니다.");
  if ((required || product.name !== undefined) && !hasValidLength(product.name ?? "", 1, 10)) {
    throw new InputError("상품명은 1~10글자로 입력해 주세요.");
  }
  if ((required || product.description !== undefined) && !hasValidLength(product.description ?? "", 10, 100)) {
    throw new InputError("상품 설명은 10~100글자로 입력해 주세요.");
  }
  if ((required || product.price !== undefined) && (!Number.isInteger(product.price) || product.price < 0 || product.price > 2147483647)) {
    throw new InputError("가격은 0 이상 2147483647 이하의 정수로 입력해 주세요.");
  }
  if ((required || product.tags !== undefined) && (!product.tags?.length || product.tags.some((tag) => !hasValidLength(tag, 1, 5)))) {
    throw new InputError("태그를 한 개 이상 입력하고, 각 태그는 1~5글자로 입력해 주세요.");
  }
  return product;
}
