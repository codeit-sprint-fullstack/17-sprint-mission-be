BEGIN;

INSERT INTO products (id, name, description, price, tags)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  '기계식 키보드', '상태가 좋은 중고 키보드입니다.', 45000, ARRAY['키보드', '전자기기']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO articles (id, title, content)
VALUES (
  '00000000-0000-4000-8000-000000000002',
  '중고 거래할 때 무엇을 확인하나요?', '첫 거래를 앞두고 있어서 팁이 궁금합니다.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO comments (id, content, product_id, article_id)
VALUES
  (
    '00000000-0000-4000-8000-000000000003',
    '키보드에 사용감이 있나요?',
    '00000000-0000-4000-8000-000000000001', NULL
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    '거래 전에 작동 상태를 확인해 보세요.',
    NULL, '00000000-0000-4000-8000-000000000002'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
