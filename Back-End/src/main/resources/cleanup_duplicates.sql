-- 중복 데이터 정리 스크립트
-- products와 options 테이블의 중복 데이터를 삭제

-- 1. products 테이블 중복 삭제
-- 같은 company_id, category_id, name을 가진 레코드 중 가장 작은 id만 남기고 나머지 삭제
DELETE p1 FROM products p1
INNER JOIN products p2 
WHERE p1.id > p2.id 
AND p1.company_id = p2.company_id 
AND p1.category_id = p2.category_id 
AND p1.name = p2.name;

-- 2. options 테이블 중복 삭제
-- 같은 company_id, category_id, name을 가진 레코드 중 가장 작은 id만 남기고 나머지 삭제
-- category_id가 NULL인 경우도 고려
DELETE o1 FROM options o1
INNER JOIN options o2 
WHERE o1.id > o2.id 
AND o1.company_id = o2.company_id 
AND (o1.category_id = o2.category_id OR (o1.category_id IS NULL AND o2.category_id IS NULL))
AND o1.name = o2.name;

