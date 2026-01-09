-- PVC 발포문틀 옵션 확인 및 수정 스크립트
-- 이 스크립트를 MySQL에서 직접 실행하여 문제를 확인하고 수정할 수 있습니다.

-- 1. PVC 발포문틀의 product_id 확인
SELECT id, name, description FROM products WHERE name = 'PVC 발포문틀';

-- 2. PVC 발포문틀 옵션 확인 (product_id가 NULL이거나 잘못된 경우)
SELECT o.id, o.name, o.add_price, o.product_id, p.name as product_name
FROM options o
LEFT JOIN products p ON o.product_id = p.id
WHERE o.name IN ('문틀타공시', '보양작업비', '보양재 단가', '반조립시', '백골 155바 까지', '백골 175바 이상')
ORDER BY o.name;

-- 3. PVC 발포문틀의 product_id로 옵션 확인
SELECT o.id, o.name, o.add_price, o.product_id
FROM options o
WHERE o.product_id = (SELECT id FROM products WHERE name = 'PVC 발포문틀' LIMIT 1);

-- 4. 옵션 수정 (product_id가 NULL인 경우)
UPDATE options 
SET product_id = (SELECT id FROM products WHERE name = 'PVC 발포문틀' LIMIT 1)
WHERE company_id = (SELECT id FROM companies WHERE code = 'CHEZNOUS' LIMIT 1)
AND category_id = (SELECT id FROM categories WHERE code = 'FRAME' LIMIT 1)
AND name IN ('문틀타공시', '보양작업비', '보양재 단가', '반조립시', '백골 155바 까지', '백골 175바 이상')
AND (product_id IS NULL OR product_id != (SELECT id FROM products WHERE name = 'PVC 발포문틀' LIMIT 1));

