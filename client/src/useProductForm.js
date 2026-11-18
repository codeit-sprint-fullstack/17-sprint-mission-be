import { useState } from "react";

export default function useProductForm() {
  const [fields, setFields] = useState({ name: "", description: "", price: "", tag: "" });
  const [tags, setTags] = useState([]);
  const [touched, setTouched] = useState({});
  const name = fields.name.trim();
  const description = fields.description.trim();
  const tag = fields.tag.trim();
  const errors = {};
  if (!name || name.length > 10) errors.name = "상품명은 1~10자로 입력해 주세요.";
  if (description.length < 10 || description.length > 100) errors.description = "상품 소개는 10~100자로 입력해 주세요.";
  if (!/^\d+$/.test(fields.price) || !Number.isSafeInteger(Number(fields.price))) errors.price = "판매 가격은 유효한 숫자로 입력해 주세요.";
  if (tag.length > 5) errors.tag = "태그 하나는 5자까지 입력할 수 있어요.";
  else if (tag) errors.tag = "Enter를 눌러 태그를 추가해 주세요.";
  else if (!tags.length) errors.tag = "태그를 하나 이상 추가해 주세요.";

  function change(key, value) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  function touch(key) {
    setTouched((previous) => ({ ...previous, [key]: true }));
  }

  function addTag(event) {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    touch("tag");
    if (!tag || tag.length > 5) return;
    setTags((previous) => [...previous, tag]);
    change("tag", "");
  }

  function removeTag(index) {
    setTags((previous) => previous.filter((_, position) => position !== index));
    touch("tag");
  }

  return {
    fields, tags, errors, touched, change, touch, addTag, removeTag,
    isValid: Object.keys(errors).length === 0,
    product: { name, description, price: Number(fields.price), tags },
  };
}
