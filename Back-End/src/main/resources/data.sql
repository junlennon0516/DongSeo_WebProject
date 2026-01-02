-- 1. 회사 (companies) 등록
INSERT INTO companies (name, code) VALUES ('쉐누', 'CHEZNOUS');

-- 변수 설정 (이후 쿼리에서 쉐누의 ID 계속 사용하기 위함)
SET @cid = (SELECT id FROM companies WHERE code = 'CHEZNOUS');


-- 2. 카테고리 (Categories) 등록
INSERT INTO categories (company_id, name, code) VALUES
(@cid, 'ABS 도어', 'DOOR'),
(@cid, '문틀', 'FRAME'),
(@cid, '3연동 중문', 'INTERCLOCK'),
(@cid, '목창호', 'WINDOW'),
(@cid, '몰딩', 'MOLDING');

-- 카테고리 ID 변수 저장 (편의상)
SET @cat_door = (SELECT id FROM categories WHERE company_id = @cid AND code = 'DOOR');
SET @cat_frame = (SELECT id FROM categories WHERE company_id = @cid AND code = 'FRAME');
SET @cat_interlock = (SELECT id FROM categories WHERE company_id = @cid AND code = 'INTERLOCK');
SET @cat_window = (SELECT id FROM categories WHERE company_id = @cid AND code = 'WINDOW');
SET @cat_molding = (SELECT id FROM categories WHERE company_id = @cid AND code = 'MOLDING');

-- 3. [문틀] 데이터 등록
-- 3-1. 제품 등록
-- 3-2. 규격별 단가 (product_variants)
-- 3-3. 문틀 옵션