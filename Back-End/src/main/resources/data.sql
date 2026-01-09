-- =================================================================
-- [데이터 초기화] 기존 데이터 삭제 (깨끗한 상태로 시작)
-- =================================================================
SET FOREIGN_KEY_CHECKS = 0;

-- 외래키가 있는 테이블부터 삭제 (순서 중요)
DELETE FROM price_matrix;
DELETE FROM product_variants;
DELETE FROM options;
DELETE FROM products;
DELETE FROM categories;
-- companies는 유지 (회사 정보는 보존)

SET FOREIGN_KEY_CHECKS = 1;

-- =================================================================
-- [데이터 삽입] 새 데이터 등록
-- =================================================================

-- 1. 회사 (companies) 등록 (중복 방지)
INSERT IGNORE INTO companies (name, code) VALUES ('쉐누', 'CHEZNOUS');

-- 회사 ID를 변수로 저장
SET @company_id = (SELECT id FROM companies WHERE code = 'CHEZNOUS' LIMIT 1);

-- 2. 카테고리 (Categories) 등록 (중복 방지)
-- 메인 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, 'ABS 도어', 'DOOR', NULL),
(@company_id, '문틀', 'FRAME', NULL),
(@company_id, '3연동 중문', 'INTERLOCK', NULL),
(@company_id, '목창호', 'WINDOW', NULL),
(@company_id, '몰딩', 'MOLDING', NULL),
(@company_id, '필름', 'FILM', NULL),
(@company_id, '하드웨어/기타사항', 'HARDWARE', NULL);

-- 카테고리 ID들을 변수로 저장
SET @cat_door = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR' LIMIT 1);
SET @cat_frame = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'FRAME' LIMIT 1);
SET @cat_interlock = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'INTERLOCK' LIMIT 1);
SET @cat_window = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'WINDOW' LIMIT 1);
SET @cat_molding = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'MOLDING' LIMIT 1);
SET @cat_film = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'FILM' LIMIT 1);
SET @cat_hardware = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'HARDWARE' LIMIT 1);

-- 하드웨어/기타사항 세부 카테고리 등록
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, '도어락', 'DOORLOCK', @cat_hardware),
(@company_id, '오목이', 'RECESSED_HANDLE', @cat_hardware),
(@company_id, '이지경첩', 'EASY_HINGE', @cat_hardware),
(@company_id, '풀핸들', 'PULL_HANDLE', @cat_hardware),
(@company_id, '도어스토퍼', 'DOOR_STOPPER', @cat_hardware),
(@company_id, '포장용 보호 필름', 'PACKAGING_FILM', @cat_hardware),
(@company_id, '기타철물', 'OTHER_HARDWARE', @cat_hardware),
(@company_id, '행거 하드웨어', 'HANGER_HARDWARE', @cat_hardware);

-- 하드웨어 세부 카테고리 ID 변수 저장
SET @cat_doorlock = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOORLOCK' LIMIT 1);
SET @cat_recessed_handle = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'RECESSED_HANDLE' LIMIT 1);
SET @cat_easy_hinge = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'EASY_HINGE' LIMIT 1);
SET @cat_pull_handle = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'PULL_HANDLE' LIMIT 1);
SET @cat_door_stopper = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_STOPPER' LIMIT 1);
SET @cat_packaging_film = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'PACKAGING_FILM' LIMIT 1);
SET @cat_other_hardware = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'OTHER_HARDWARE' LIMIT 1);
SET @cat_hanger_hardware = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'HANGER_HARDWARE' LIMIT 1);

-- =================================================================
-- 3. [문틀] 데이터 등록
-- 3-1. 제품 등록 - PVC 발포문틀 (Upsert 방식: 있으면 업데이트, 없으면 삽입)
-- UNIQUE 제약조건: (company_id, category_id, name)
INSERT INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_frame, 'PVC 발포문틀', 'PVC (110~245바)')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);
-- PVC 발포문틀의 product_id를 변수로 저장 (ID 보존)
SET @product_pvc_frame = (SELECT id FROM products WHERE company_id = @company_id AND category_id = @cat_frame AND name = 'PVC 발포문틀' LIMIT 1);

-- ------------------------------------------
-- 3-2. 규격별 단가 (product_variants) - PVC 발포문틀
-- 가격 규칙: 일반형 3방(기본) -> 일반형 4방(+3000) -> 가스켓 3방(+4000) -> 가스켓 4방(+7000)
-- UNIQUE 제약조건: (product_id, spec_name, type_name)
INSERT INTO product_variants (product_id, spec_name, type_name, price) VALUES
-- 110바
(@product_pvc_frame, '110바', '일반형 3방', 39000),
(@product_pvc_frame, '110바', '일반형 4방', 42000),
(@product_pvc_frame, '110바', '가스켓 3방', 43000),
(@product_pvc_frame, '110바', '가스켓 4방', 46000),
-- 130바
(@product_pvc_frame, '130바', '일반형 3방', 46000),
(@product_pvc_frame, '130바', '일반형 4방', 49000),
(@product_pvc_frame, '130바', '가스켓 3방', 50000),
(@product_pvc_frame, '130바', '가스켓 4방', 53000),
-- 140바
(@product_pvc_frame, '140바', '일반형 3방', 47000),
(@product_pvc_frame, '140바', '일반형 4방', 50000),
(@product_pvc_frame, '140바', '가스켓 3방', 51000),
(@product_pvc_frame, '140바', '가스켓 4방', 54000),
-- 155바
(@product_pvc_frame, '155바', '일반형 3방', 52000),
(@product_pvc_frame, '155바', '일반형 4방', 55000),
(@product_pvc_frame, '155바', '가스켓 3방', 56000),
(@product_pvc_frame, '155바', '가스켓 4방', 59000),
-- 175바
(@product_pvc_frame, '175바', '일반형 3방', 60000),
(@product_pvc_frame, '175바', '일반형 4방', 63000),
(@product_pvc_frame, '175바', '가스켓 3방', 64000),
(@product_pvc_frame, '175바', '가스켓 4방', 67000),
-- 195바
(@product_pvc_frame, '195바', '일반형 3방', 64000),
(@product_pvc_frame, '195바', '일반형 4방', 67000),
(@product_pvc_frame, '195바', '가스켓 3방', 68000),
(@product_pvc_frame, '195바', '가스켓 4방', 71000),
-- 210바
(@product_pvc_frame, '210바', '일반형 3방', 70000),
(@product_pvc_frame, '210바', '일반형 4방', 73000),
(@product_pvc_frame, '210바', '가스켓 3방', 74000),
(@product_pvc_frame, '210바', '가스켓 4방', 77000),
-- 230바
(@product_pvc_frame, '230바', '일반형 3방', 75000),
(@product_pvc_frame, '230바', '일반형 4방', 78000),
(@product_pvc_frame, '230바', '가스켓 3방', 79000),
(@product_pvc_frame, '230바', '가스켓 4방', 82000),
-- 245바
(@product_pvc_frame, '245바', '일반형 3방', 80000),
(@product_pvc_frame, '245바', '일반형 4방', 83000),
(@product_pvc_frame, '245바', '가스켓 3방', 84000),
(@product_pvc_frame, '245바', '가스켓 4방', 87000)
ON DUPLICATE KEY UPDATE
    price = VALUES(price);

-- ------------------------------------------
-- 3-3. PVC 발포문틀 옵션 (Upsert 방식)
-- UNIQUE 제약조건: (company_id, product_id, name)
INSERT INTO options (company_id, category_id, product_id, name, add_price) VALUES
(@company_id, @cat_frame, @product_pvc_frame, '문틀타공시', 2000),
(@company_id, @cat_frame, @product_pvc_frame, '보양작업비', 1000),
(@company_id, @cat_frame, @product_pvc_frame, '보양재 단가', 2000),
(@company_id, @cat_frame, @product_pvc_frame, '반조립시', -2000),
(@company_id, @cat_frame, @product_pvc_frame, '백골 155바 까지', -2000),
(@company_id, @cat_frame, @product_pvc_frame, '백골 175바 이상', -3000)
ON DUPLICATE KEY UPDATE
    add_price = VALUES(add_price),
    category_id = VALUES(category_id);

-- ------------------------------------------
-- 3-4. [슬림문틀] 추가 등록
-- 기존 "슬림문틀 (12mm 문선)" 제품명을 "가스켓형 슬림문틀 (12mm)"로 변경
-- 제품명 변경은 특수 케이스이므로 UPDATE 사용
UPDATE products
SET name = '가스켓형 슬림문틀 (12mm)',
    description = '가스켓형 슬림문틀 (3방틀 전용)'
WHERE company_id = @company_id
AND category_id = @cat_frame
AND name = '슬림문틀 (12mm 문선)';

-- 새 제품명으로 Upsert (기존에 없을 수도 있음)
INSERT INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_frame, '가스켓형 슬림문틀 (12mm)', '가스켓형 슬림문틀 (3방틀 전용)')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

-- 슬림문틀의 product_id를 변수로 저장 (ID 보존)
SET @product_slim_frame = (SELECT id FROM products WHERE company_id = @company_id AND category_id = @cat_frame AND name = '가스켓형 슬림문틀 (12mm)' LIMIT 1);

-- 규격별 단가 (슬림문틀) - Upsert 방식
INSERT INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@product_slim_frame, '110바', '가스켓형 슬림문틀', 46000),
(@product_slim_frame, '130바', '가스켓형 슬림문틀', 53000),
(@product_slim_frame, '140바', '가스켓형 슬림문틀', 54000),
(@product_slim_frame, '155바', '가스켓형 슬림문틀', 59000),
(@product_slim_frame, '175바', '가스켓형 슬림문틀', 67000),
(@product_slim_frame, '195바', '가스켓형 슬림문틀', 71000),
(@product_slim_frame, '210바', '가스켓형 슬림문틀', 77000),
(@product_slim_frame, '230바', '가스켓형 슬림문틀', 82000)
ON DUPLICATE KEY UPDATE
    price = VALUES(price);

-- ------------------------------------------
-- 3-5. [목재문틀] 추가 등록
-- 목재문틀은 '세트'가 아닌 '사이(才)' 단위 단가이므로 product_variants로 처리
INSERT INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_frame, '목재문틀', 0, '단위: 才(사이)당 단가 (가로 x 세로 입력 필요)')
ON DUPLICATE KEY UPDATE
    base_price = VALUES(base_price),
    description = VALUES(description);

-- 목재문틀 제품 ID 가져오기 (ID 보존)
SET @product_wood_frame = (SELECT id FROM products WHERE company_id = @company_id AND category_id = @cat_frame AND name = '목재문틀' LIMIT 1);

-- 목재문틀 규격별 단가 (product_variants) - Upsert 방식
-- specName: 규격 (110, 140, 170, 200)
-- typeName: 타입 (스토퍼형, 미서기, 무매공틀 등)
-- price: 才당 단가
INSERT INTO product_variants (product_id, spec_name, type_name, price) VALUES
-- 110 규격
(@product_wood_frame, '110', '스토퍼형', 5400),
(@product_wood_frame, '110', '미서기', 5600),
(@product_wood_frame, '110', '무매공틀', 5600),
(@product_wood_frame, '110', '외줄미서기 / 포켓행거', 5600),
-- 140 규격
(@product_wood_frame, '140', '스토퍼형', 5400),
(@product_wood_frame, '140', '미서기', 5600),
(@product_wood_frame, '140', '무매공틀', 5600),
(@product_wood_frame, '140', '외줄미서기 / 포켓행거', 5600),
-- 170 규격
(@product_wood_frame, '170', '스토퍼형', 5400),
(@product_wood_frame, '170', '미서기', 5600),
(@product_wood_frame, '170', '무매공틀', 5600),
(@product_wood_frame, '170', '외줄미서기 / 포켓행거', 5600),
-- 200 규격
(@product_wood_frame, '200', '스토퍼형', 5400),
(@product_wood_frame, '200', '미서기', 5600),
(@product_wood_frame, '200', '무매공틀', 5600),
(@product_wood_frame, '200', '외줄미서기 / 포켓행거', 5600)
ON DUPLICATE KEY UPDATE
    price = VALUES(price);

-- ------------------------------------------
-- 3-6. 슬림문틀 옵션 (Upsert 방식)
INSERT INTO options (company_id, category_id, product_id, name, add_price) VALUES
(@company_id, @cat_frame, @product_slim_frame, '높이 2101 이상', 3000),
(@company_id, @cat_frame, @product_slim_frame, '가로폭 1201 이상', 10000)
ON DUPLICATE KEY UPDATE
    add_price = VALUES(add_price),
    category_id = VALUES(category_id);


-- =================================================================
-- 4. [3연동 중문] 데이터 등록
-- 4-1. 제품 등록 (Upsert 방식)
INSERT INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_interlock, '목재 3연동', '기본 목재 3연동 중문 세트')
ON DUPLICATE KEY UPDATE
    description = VALUES(description);

-- 목재 3연동의 product_id를 변수로 저장 (ID 보존)
SET @product_interlock = (SELECT id FROM products WHERE company_id = @company_id AND category_id = @cat_interlock AND name = '목재 3연동' LIMIT 1);

-- ------------------------------------------
-- 4-2. 범위별 단가표 (Upsert 방식)
-- price_matrix에는 UNIQUE 제약조건이 없으므로, 기존 데이터 삭제 후 삽입
-- (같은 product_id, option_name, max_width 조합이 여러 개 있을 수 있으므로)
DELETE FROM price_matrix WHERE product_id = @product_interlock;
INSERT INTO price_matrix (product_id, option_name, max_width, price) VALUES
-- A. 기본 세트 가격
(@product_interlock, '기본세트', 1250, 285000),
(@product_interlock, '기본세트', 1350, 295000),
(@product_interlock, '기본세트', 1550, 305000),
(@product_interlock, '기본세트', 1650, 325000),
(@product_interlock, '기본세트', 1850, 345000),
(@product_interlock, '기본세트', 2150, 385000),
-- B. 유리 옵션 - 투명 5T
(@product_interlock, '투명유리 (5T) 포함', 1250, 348000),
(@product_interlock, '투명유리 (5T) 포함', 1350, 365000),
(@product_interlock, '투명유리 (5T) 포함', 1550, 389000),
(@product_interlock, '투명유리 (5T) 포함', 1850, 445000),
-- C. 망입유리 옵션
(@product_interlock, '망입유리 (5T) 포함', 1250, 447000),
(@product_interlock, '망입유리 (5T) 포함', 1350, 468000),
(@product_interlock, '망입유리 (5T) 포함', 1850, 595000);

-- ------------------------------------------
-- 4-3. 중문 옵션 (Upsert 방식)
-- product_id가 NULL인 경우 UNIQUE 제약조건이 제대로 작동하지 않을 수 있으므로
-- 기존 옵션 삭제 후 삽입 (카테고리 전체 공통 옵션이므로 안전)
DELETE FROM options WHERE company_id = @company_id AND category_id = @cat_interlock AND product_id IS NULL AND name IN ('하단 고시형 추가', '유리 강화(규격별 상이-로직처리필요)');
INSERT INTO options (company_id, category_id, product_id, name, add_price) VALUES
(@company_id, @cat_interlock, NULL, '하단 고시형 추가', 30000),
(@company_id, @cat_interlock, NULL, '유리 강화(규격별 상이-로직처리필요)', 0);

-- -----------------------------------------------------------------
-- 4-4. [3연동 중문] - 목재 3연동 중문 (product_variants 사용)
-- -----------------------------------------------------------------

INSERT INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_interlock, '목재 3연동 중문', '유리포함 / 세트가격 / VAT별도')
ON DUPLICATE KEY UPDATE description = VALUES(description);

SET @product_wood_interlock = (
  SELECT id FROM products 
  WHERE company_id=@company_id AND category_id=@cat_interlock 
  AND name='목재 3연동 중문' LIMIT 1
);

-- 목재 3연동 중문의 기존 variants 삭제 후 삽입
DELETE FROM product_variants WHERE product_id = @product_wood_interlock;

INSERT INTO product_variants (product_id, spec_name, type_name, price) VALUES
-- 투명 5T
(@product_wood_interlock, '1250 이하', '투명 5T', 348000),
(@product_wood_interlock, '1350 이하', '투명 5T', 365000),
(@product_wood_interlock, '1550 이하', '투명 5T', 389000),
(@product_wood_interlock, '1650 이하', '투명 5T', 416000),
(@product_wood_interlock, '1850 이하', '투명 5T', 445000),
(@product_wood_interlock, '2150 이하', '투명 5T', 505000),

-- 일반무늬
(@product_wood_interlock, '1250 이하', '일반무늬', 355000),
(@product_wood_interlock, '1350 이하', '일반무늬', 370000),
(@product_wood_interlock, '1550 이하', '일반무늬', 400000),
(@product_wood_interlock, '1650 이하', '일반무늬', 423000),
(@product_wood_interlock, '1850 이하', '일반무늬', 451000),
(@product_wood_interlock, '2150 이하', '일반무늬', 511000),

-- 망입유리 5T
(@product_wood_interlock, '1250 이하', '망입유리 5T', 447000),
(@product_wood_interlock, '1350 이하', '망입유리 5T', 468000),
(@product_wood_interlock, '1550 이하', '망입유리 5T', 521000),
(@product_wood_interlock, '1650 이하', '망입유리 5T', 552000),
(@product_wood_interlock, '1850 이하', '망입유리 5T', 595000),
(@product_wood_interlock, '2150 이하', '망입유리 5T', 685000),

-- 브론즈 투명 5T
(@product_wood_interlock, '1250 이하', '브론즈 투명 5T', 390000),
(@product_wood_interlock, '1350 이하', '브론즈 투명 5T', 411000),
(@product_wood_interlock, '1550 이하', '브론즈 투명 5T', 444000),
(@product_wood_interlock, '1650 이하', '브론즈 투명 5T', 477000),
(@product_wood_interlock, '1850 이하', '브론즈 투명 5T', 511000),
(@product_wood_interlock, '2150 이하', '브론즈 투명 5T', 584000);

-- 목재 3연동 중문의 기존 옵션 삭제 후 삽입
DELETE FROM options WHERE company_id = @company_id AND category_id = @cat_interlock AND product_id = @product_wood_interlock;

INSERT INTO options (company_id, category_id, product_id, name, add_price) VALUES
(@company_id, @cat_interlock, @product_wood_interlock, '유리추가 1250 이하', 10000),
(@company_id, @cat_interlock, @product_wood_interlock, '유리추가 1350 이하', 12000),
(@company_id, @cat_interlock, @product_wood_interlock, '유리추가 1550 이하', 15000),
(@company_id, @cat_interlock, @product_wood_interlock, '유리추가 1650 이하', 17000),
(@company_id, @cat_interlock, @product_wood_interlock, '유리추가 1850 이하', 20000),
(@company_id, @cat_interlock, @product_wood_interlock, '유리추가 2150 이하', 25000);


-- =================================================================
-- 5. [ABS 도어] 데이터 상세 등록
-- =================================================================

-- (1) 기본 설정: 회사 및 도어 카테고리 ID 가져오기
SET @company_id = (SELECT id FROM companies WHERE code = 'CHEZNOUS' LIMIT 1);
SET @cat_door = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR' LIMIT 1);

-- -----------------------------------------------------------------
-- 5-0. ABS 도어 메인 카테고리 등록
-- -----------------------------------------------------------------
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, '베이직 도어', 'DOOR_BASIC', @cat_door),
(@company_id, '네추럴 도어', 'DOOR_NATURAL', @cat_door),
(@company_id, '포인트 도어', 'DOOR_POINT', @cat_door),
(@company_id, '라인 도어', 'DOOR_LINE', @cat_door),
(@company_id, '타공 도어', 'DOOR_GLASS', @cat_door);

-- 메인 카테고리 ID 변수 저장
SET @cat_door_basic = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_BASIC' LIMIT 1);
SET @cat_door_natural = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_NATURAL' LIMIT 1);
SET @cat_door_point = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_POINT' LIMIT 1);
SET @cat_door_line = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_LINE' LIMIT 1);
SET @cat_door_glass = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS' LIMIT 1);

-- -----------------------------------------------------------------
-- 5-1. ABS 도어 세부 카테고리 및 제품 등록
-- -----------------------------------------------------------------

-- 1. 베이직 도어 세부 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, 'ABS 민자 (베이직)', 'DOOR_BASIC_PLAIN', @cat_door_basic),
(@company_id, 'ABS 디자인 (베이직) - 세트1', 'DOOR_BASIC_DESIGN1', @cat_door_basic),
(@company_id, 'ABS 디자인 (베이직) - 세트2', 'DOOR_BASIC_DESIGN2', @cat_door_basic),
(@company_id, 'ABS 디자인 (베이직) - 세트3', 'DOOR_BASIC_DESIGN3', @cat_door_basic),
(@company_id, 'ABS 디자인 (베이직) - 세트4', 'DOOR_BASIC_DESIGN4', @cat_door_basic);

SET @cat_basic_plain = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_BASIC_PLAIN' LIMIT 1);
SET @cat_basic_design1 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_BASIC_DESIGN1' LIMIT 1);
SET @cat_basic_design2 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_BASIC_DESIGN2' LIMIT 1);
SET @cat_basic_design3 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_BASIC_DESIGN3' LIMIT 1);
SET @cat_basic_design4 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_BASIC_DESIGN4' LIMIT 1);

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_basic_plain, 'ABS 민자 (베이직)', 57000, '기본 민자 도어');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_basic_design1, 'ABS 디자인 (베이직)', 58000, '오르토 / 디엔 / CNB-22 / 오페라 / 모티브');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_basic_design2, 'ABS 디자인 (베이직)', 58000, '엘보 / 쉘 / 아틀라스(세로) / 아틀라스(가로)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_basic_design3, 'ABS 디자인 (베이직)', 58000, '큐피트 / 심플라인 / 피아노 / 브로우 / CNB-16 / CNB-15');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_basic_design4, 'ABS 디자인 (베이직)', 58000, 'CNB-14 / 13 / 12 / 11 / 09 / 06 / 05 / 03 / 02 / 01');

-- 2. 네추럴 도어 세부 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, 'ABS 내추럴', 'DOOR_NATURAL_DESIGN', @cat_door_natural);

SET @cat_natural_design = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_NATURAL_DESIGN' LIMIT 1);

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_natural_design, 'ABS 내추럴', 62000, '고딕 / 트윈 / 트리플 / 모던 / 클래식 / 로드 / 초콜릿');

-- 3. 포인트 도어 세부 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, 'ABS 포인트', 'DOOR_POINT_DESIGN', @cat_door_point);

SET @cat_point_design = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_POINT_DESIGN' LIMIT 1);

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_point_design, 'ABS 포인트', 66000, '아일랜드 / 리벨 / 보르도 / 민들레');

-- 4. 라인 도어 세부 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, 'ABS 라인 (더블렉탱글)', 'DOOR_LINE_DOUBLE', @cat_door_line),
(@company_id, 'ABS 라인 (오스카)', 'DOOR_LINE_OSCAR', @cat_door_line),
(@company_id, 'ABS 라인 (이븐/로젠)', 'DOOR_LINE_EVEN', @cat_door_line),
(@company_id, 'ABS 라인 (사각라인)', 'DOOR_LINE_SQUARE', @cat_door_line);

SET @cat_line_double = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_LINE_DOUBLE' LIMIT 1);
SET @cat_line_oscar = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_LINE_OSCAR' LIMIT 1);
SET @cat_line_even = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_LINE_EVEN' LIMIT 1);
SET @cat_line_square = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_LINE_SQUARE' LIMIT 1);

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_line_double, 'ABS 라인 (더블렉탱글)', 66000, '더블렉탱글');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_line_oscar, 'ABS 라인 (오스카)', 76000, '오스카');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_line_even, 'ABS 라인 (이븐/로젠)', 81000, '이븐/로젠');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_line_square, 'ABS 라인 (사각라인)', 86000, '사각라인');

-- 5. 타공 도어 세부 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, 'ABS 타공 (GLASS) - TD-01', 'DOOR_GLASS_TD01', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-02', 'DOOR_GLASS_TD02', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-03', 'DOOR_GLASS_TD03', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-04', 'DOOR_GLASS_TD04', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-05', 'DOOR_GLASS_TD05', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-06', 'DOOR_GLASS_TD06', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-07', 'DOOR_GLASS_TD07', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-08', 'DOOR_GLASS_TD08', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-09', 'DOOR_GLASS_TD09', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-10', 'DOOR_GLASS_TD10', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-11', 'DOOR_GLASS_TD11', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-12', 'DOOR_GLASS_TD12', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-13', 'DOOR_GLASS_TD13', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-14', 'DOOR_GLASS_TD14', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - AT-H1', 'DOOR_GLASS_ATH1', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - AT-H2', 'DOOR_GLASS_ATH2', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - AT-H3', 'DOOR_GLASS_ATH3', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - AT-H2 변형', 'DOOR_GLASS_ATH2_VAR', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - AT-H3 변형', 'DOOR_GLASS_ATH3_VAR', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-오르토', 'DOOR_GLASS_TD_ORTO', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-모던', 'DOOR_GLASS_TD_MODERN', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-클래식', 'DOOR_GLASS_TD_CLASSIC', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - TD-트리플', 'DOOR_GLASS_TD_TRIPLE', @cat_door_glass),
(@company_id, 'ABS 타공 (GLASS) - 2구타공', 'DOOR_GLASS_2GU', @cat_door_glass);

SET @cat_glass_td01 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD01' LIMIT 1);
SET @cat_glass_td02 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD02' LIMIT 1);
SET @cat_glass_td03 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD03' LIMIT 1);
SET @cat_glass_td04 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD04' LIMIT 1);
SET @cat_glass_td05 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD05' LIMIT 1);
SET @cat_glass_td06 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD06' LIMIT 1);
SET @cat_glass_td07 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD07' LIMIT 1);
SET @cat_glass_td08 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD08' LIMIT 1);
SET @cat_glass_td09 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD09' LIMIT 1);
SET @cat_glass_td10 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD10' LIMIT 1);
SET @cat_glass_td11 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD11' LIMIT 1);
SET @cat_glass_td12 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD12' LIMIT 1);
SET @cat_glass_td13 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD13' LIMIT 1);
SET @cat_glass_td14 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD14' LIMIT 1);
SET @cat_glass_ath1 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_ATH1' LIMIT 1);
SET @cat_glass_ath2 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_ATH2' LIMIT 1);
SET @cat_glass_ath3 = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_ATH3' LIMIT 1);
SET @cat_glass_ath2_var = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_ATH2_VAR' LIMIT 1);
SET @cat_glass_ath3_var = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_ATH3_VAR' LIMIT 1);
SET @cat_glass_td_orto = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD_ORTO' LIMIT 1);
SET @cat_glass_td_modern = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD_MODERN' LIMIT 1);
SET @cat_glass_td_classic = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD_CLASSIC' LIMIT 1);
SET @cat_glass_td_triple = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_TD_TRIPLE' LIMIT 1);
SET @cat_glass_2gu = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'DOOR_GLASS_2GU' LIMIT 1);

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td01, 'ABS 타공 (GLASS)', 99000, 'TD-01 (2구1칸고시)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td02, 'ABS 타공 (GLASS)', 106000, 'TD-02 (3구1칸고시)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td03, 'ABS 타공 (GLASS)', 110000, 'TD-03 (3구2칸고시)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td04, 'ABS 타공 (GLASS)', 96000, 'TD-04');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td05, 'ABS 타공 (GLASS)', 88000, 'TD-05');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td06, 'ABS 타공 (GLASS)', 96000, 'TD-06');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td07, 'ABS 타공 (GLASS)', 82000, 'TD-07');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td08, 'ABS 타공 (GLASS)', 88000, 'TD-08');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td09, 'ABS 타공 (GLASS)', 80000, 'TD-09 (상부타공)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td10, 'ABS 타공 (GLASS)', 83000, 'TD-10 (입구타공)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td11, 'ABS 타공 (GLASS)', 82000, 'TD-11 (반타공)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td12, 'ABS 타공 (GLASS)', 88000, 'TD-12 (2/3 2구)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td13, 'ABS 타공 (GLASS)', 81000, 'TD-13');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td14, 'ABS 타공 (GLASS)', 80000, 'TD-14');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_ath1, 'ABS 타공 (GLASS)', 110000, 'AT-H1');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_ath2, 'ABS 타공 (GLASS)', 120000, 'AT-H2');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_ath3, 'ABS 타공 (GLASS)', 110000, 'AT-H3');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_ath2_var, 'ABS 타공 (GLASS)', 128000, 'AT-H2 변형 (하단고시)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_ath3_var, 'ABS 타공 (GLASS)', 118000, 'AT-H3 변형 (하단고시)');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td_orto, 'ABS 타공 (GLASS)', 89000, 'TD-오르토');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td_modern, 'ABS 타공 (GLASS)', 93000, 'TD-모던');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td_classic, 'ABS 타공 (GLASS)', 93000, 'TD-클래식');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_td_triple, 'ABS 타공 (GLASS)', 93000, 'TD-트리플');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_glass_2gu, 'ABS 타공 (GLASS)', 88000, '2구타공');

-- -----------------------------------------------------------------
-- 5-2-1. 도어 옵션 등록 (Options)
-- -----------------------------------------------------------------
-- 'DOOR' 카테고리에 공통으로 적용되는 옵션들입니다.
-- 기존 옵션 삭제 후 재등록 (DELETE 후 INSERT 방식)
DELETE FROM options WHERE company_id = @company_id AND category_id = @cat_door AND product_id IS NULL;

INSERT INTO options (company_id, category_id, name, add_price) VALUES
-- 1. 디자인 포인트 (엑셀의 '포인트' 컬럼 반영)
(@company_id, @cat_door, '디자인 포인트 추가 (오르토/리벨 등)', 15000),

-- 2. 엣지 및 보강 옵션
(@company_id, @cat_door, '양면 엣지', 1000),
(@company_id, @cat_door, '손잡이부 심재 보강', 3000),
(@company_id, @cat_door, '좌/우 다대 심재보강', 8000),
(@company_id, @cat_door, '상/하 심재보강', 5000),

-- 3. 가공 및 홈파기 옵션
(@company_id, @cat_door, '미닫이용 하부호차구멍 가공', 3000),
(@company_id, @cat_door, '상/하 오메가홈 / 미소턱 가공', 10000),
(@company_id, @cat_door, '헹거용 하부홈', 5000),

-- 4. 부착물 및 기타 옵션
(@company_id, @cat_door, '오목이 부착', 13000),
(@company_id, @cat_door, '오도시 한쪽 가공부착', 10000),
(@company_id, @cat_door, '오도시 상/하 가공부착', 18000),

(@company_id, @cat_door, '엣지풀 부착', 10000),
(@company_id, @cat_door, '윈드컷 부착 (하부심재보강)', 25000),
(@company_id, @cat_door, 'ABS도어 연동호차부착 (짝당)', 10000),

(@company_id, @cat_door, '손끼임방지캡 상.하 가공', 5000),
(@company_id, @cat_door, '백골', -2000);

-- 5-2-2. 도어 비규격 옵션


-- =================================================================
-- 5-3. [목창호] 데이터 상세 등록
-- =================================================================

-- (1) 기본 설정: 회사 및 목창호 카테고리 ID 가져오기
SET @company_id = (SELECT id FROM companies WHERE code = 'CHEZNOUS' LIMIT 1);
SET @cat_window = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'WINDOW' LIMIT 1);

-- -----------------------------------------------------------------
-- 5-3-1. 목창호 메인 카테고리 등록
-- -----------------------------------------------------------------
-- 목창호는 이미 메인 카테고리로 등록되어 있음

-- -----------------------------------------------------------------
-- 5-3-2. 목창호 세부 카테고리 및 제품 등록
-- -----------------------------------------------------------------

-- 간살 목창호 세부 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, '간살 목창호', 'WINDOW_GANSAL', @cat_window);

SET @cat_window_gansal = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'WINDOW_GANSAL' LIMIT 1);

-- 간살 목창호 제품 등록
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_gansal, '간살 목창호 - 미닫이 (80바)', 0, '간살 A / 간살 B (투명, 브론즈) - 유리포함');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_gansal, '간살 목창호 - 여닫이 (120바)', 0, '간살 A / 간살 B (투명, 브론즈) - 유리포함');

SET @product_gansal_midani = (SELECT id FROM products WHERE company_id = @company_id AND category_id = @cat_window_gansal AND name = '간살 목창호 - 미닫이 (80바)' LIMIT 1);
SET @product_gansal_yodani = (SELECT id FROM products WHERE company_id = @company_id AND category_id = @cat_window_gansal AND name = '간살 목창호 - 여닫이 (120바)' LIMIT 1);

-- 간살 목창호 - 미닫이 (80바) 가격 매트릭스
INSERT IGNORE INTO price_matrix (product_id, option_name, max_width, max_height, price) VALUES
(@product_gansal_midani, '미닫이 (80바)', 385, 99999, 112000),
(@product_gansal_midani, '미닫이 (80바)', 460, 99999, 127000),
(@product_gansal_midani, '미닫이 (80바)', 560, 99999, 145000),
(@product_gansal_midani, '미닫이 (80바)', 650, 99999, 162000),
(@product_gansal_midani, '미닫이 (80바)', 750, 99999, 181000),
(@product_gansal_midani, '미닫이 (80바)', 850, 99999, 200000),
(@product_gansal_midani, '미닫이 (80바)', 950, 99999, 219000),
(@product_gansal_midani, '미닫이 (80바)', 1040, 99999, 236000),
(@product_gansal_midani, '미닫이 (80바)', 1150, 99999, 264000);

-- 간살 목창호 - 여닫이 (120바) 가격 매트릭스
INSERT IGNORE INTO price_matrix (product_id, option_name, max_width, max_height, price) VALUES
(@product_gansal_yodani, '여닫이 (120바)', 455, 99999, 122000),
(@product_gansal_yodani, '여닫이 (120바)', 540, 99999, 137000),
(@product_gansal_yodani, '여닫이 (120바)', 630, 99999, 155000),
(@product_gansal_yodani, '여닫이 (120바)', 730, 99999, 172000),
(@product_gansal_yodani, '여닫이 (120바)', 830, 99999, 191000),
(@product_gansal_yodani, '여닫이 (120바)', 930, 99999, 210000),
(@product_gansal_yodani, '여닫이 (120바)', 1030, 99999, 229000),
(@product_gansal_yodani, '여닫이 (120바)', 1130, 99999, 246000),
(@product_gansal_yodani, '여닫이 (120바)', 1150, 99999, 274000);

-- -----------------------------------------------------------------
-- 5-3-3. 일반 목창호 세부 카테고리 및 제품 등록
-- -----------------------------------------------------------------

-- 일반 목창호 세부 카테고리
INSERT IGNORE INTO categories (company_id, name, code, parent_id) VALUES
(@company_id, '일반 목창호', 'WINDOW_NORMAL', @cat_window);

SET @cat_window_normal = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'WINDOW_NORMAL' LIMIT 1);

-- 일반 목창호 제품 등록
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_normal, '미닫이 - 입구형', 58000, '입구형 미닫이 목창호');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_normal, '미닫이 - 2구~5구형', 63000, '2구~5구형 미닫이 목창호');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_normal, '미닫이 - 비대칭 6구', 96000, '비대칭 6구 미닫이 목창호');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_normal, '미닫이 - 6구~9구', 96000, '6구~9구 미닫이 목창호');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_normal, '미닫이 - 10구형', 106000, '10구형 미닫이 목창호');

INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES (@company_id, @cat_window_normal, '미닫이 - 15구형', 116000, '15구형 미닫이 목창호');

-- -----------------------------------------------------------------
-- 5-3-4. 목창호 옵션 등록
-- -----------------------------------------------------------------
DELETE FROM options WHERE company_id = @company_id AND category_id = @cat_window AND product_id IS NULL;

INSERT INTO options (company_id, category_id, name, add_price) VALUES
-- 기존 옵션
(@company_id, @cat_window, '높이 2101 이상', 20000),
(@company_id, @cat_window, '높이 2101 이상 (일부 구간)', 25000),
(@company_id, @cat_window, '여닫이 (80바)', 10000),
-- 추가 옵션
(@company_id, @cat_window, '오도시 한쪽 부착', 10000),
(@company_id, @cat_window, '오도시 상하 부착', 18000),
(@company_id, @cat_window, '4.5T 고시 (칸당)', 8000),
(@company_id, @cat_window, '폭 1051 이상', 5000),
(@company_id, @cat_window, '높이 2101 이상 (일반)', 10000),
(@company_id, @cat_window, '연동호차 부착', 10000),
(@company_id, @cat_window, '엣지폼 부착', 10000),
(@company_id, @cat_window, '상·하 미소홈', 10000);



-- =================================================================
-- 6. [몰딩] 데이터 상세 등록
-- (1) 기본 설정: 회사 및 몰딩 카테고리 ID 가져오기
SET @company_id = (SELECT id FROM companies WHERE code = 'CHEZNOUS' LIMIT 1);
SET @cat_molding = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'MOLDING' LIMIT 1);

-- 몰딩 카테고리에 잘못 들어간 인테리어 필름 제품 삭제 (있다면)
DELETE FROM products WHERE company_id = @company_id AND category_id = @cat_molding AND name LIKE '%인테리어%필름%';

-- ------------------------------------------
-- 6-1. 평몰딩 (Flat Molding)
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '평몰딩', '일반 평판 몰딩 (3전~40전)');

SET @p_flat = (SELECT id FROM products WHERE company_id = @company_id AND name = '평몰딩' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_flat, '30*9T*2440', '평판(3전)', 1320),
(@p_flat, '40*9T*2440', '평판(4전)', 1500),
(@p_flat, '50*9T*2440', '평판(5전)', 1730),
(@p_flat, '60*9T*2440', '평판(6전)', 1870),
(@p_flat, '80*9T*2440', '평판(8전)', 2300),
(@p_flat, '100*9T*2440', '평판(10전)', 2780),
(@p_flat, '120*9T*2440', '평판(12전)', 3300),
(@p_flat, '150*9T*2440', '평판(15전)', 3950),
(@p_flat, '160*9T*2440', '평판(16전)/주문제', 4300),
(@p_flat, '200*9T*2440', '평판(20전)', 5000),
(@p_flat, '250*9T*2440', '평판(25전)', 6900),
(@p_flat, '300*9T*2440', '평판(30전)', 7500),
(@p_flat, '400*9T*2440', '평판(40전)', 9500);

-- ------------------------------------------
-- 6-2. 문선 (Door Trim)
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '문선 몰딩', '슬림문선, 평문선, 반달문선');

SET @p_trim = (SELECT id FROM products WHERE company_id = @company_id AND name = '문선 몰딩' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_trim, '30*12T*2440', '30 슬림문선', 1870),
(@p_trim, '40*12T*2440', '40 슬림문선', 2000),
(@p_trim, '60*12T*2440', '평문선', 2300),
(@p_trim, '57*15T*2440', '반달문선', 2970);

-- ------------------------------------------
-- 6-3. 천정 몰딩 (Ceiling Molding)
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '천정 몰딩', '천정 몰딩 및 마이너스 몰딩');

SET @p_ceiling = (SELECT id FROM products WHERE company_id = @company_id AND name = '천정 몰딩' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_ceiling, '55*12T*2440', '천정(소)', 2530),
(@p_ceiling, '70*12T*2440', '천정(중)', 2900),
(@p_ceiling, '80*12T*2440', '천정(대)', 3200),
(@p_ceiling, '25*15T*2440', '마이너스 계단몰딩', 1930);

-- ------------------------------------------
-- 6-4. 걸레받이 (Baseboard)
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '걸레받이', '바닥 걸레받이 (6전~9전)');

SET @p_base = (SELECT id FROM products WHERE company_id = @company_id AND name = '걸레받이' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_base, '60*9T*2440', '6전 걸레받이', 2450),
(@p_base, '80*9T*2440', '8전 걸레받이', 2650),
(@p_base, '90*9T*2440', '9전 걸레받이', 2850);

-- ------------------------------------------
-- 6-5. 루바 (Louver)
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '루바', '디자인 루바 및 마감재');

SET @p_louver = (SELECT id FROM products WHERE company_id = @company_id AND name = '루바' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_louver, '240*9T*2440', '루바(소)', 6730),
(@p_louver, '400*9T*2440', '루바(대)', 11000),
(@p_louver, '90*12T*2440', '루바마감재', 3650);

-- ------------------------------------------
-- 6-6. 계단 몰딩 (Stair)
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '계단 몰딩', '2계단 몰딩');

SET @p_stair = (SELECT id FROM products WHERE company_id = @company_id AND name = '계단 몰딩' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_stair, '50*12T*2440', '2계단(소)', 2380),
(@p_stair, '60*12T*2440', '2계단(중)', 2800);

-- ------------------------------------------
-- 6-7. 기둥 몰딩 (Pillar)
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '기둥 몰딩', '기둥 장식 몰딩');

SET @p_pillar = (SELECT id FROM products WHERE company_id = @company_id AND name = '기둥 몰딩' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_pillar, '40*9T*2440', '기둥(소)', 5050),
(@p_pillar, '65*12T*2440', '기둥(중)', 6950),
(@p_pillar, '100*12T*2440', '기둥(대)', 8750);

-- ------------------------------------------
-- 6-8. PVC 몰딩
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, 'PVC 몰딩', 'PVC 2계단 및 직각걸레받이');

SET @p_pvc = (SELECT id FROM products WHERE company_id = @company_id AND name = 'PVC 몰딩' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_pvc, '35*15T*2440', 'PVC 2계단', 1950),
(@p_pvc, '35*15T*2440', 'PVC 2계단 (무래핑 백색)', 1350),
(@p_pvc, '60*9T*2440', 'PVC 직각걸레받이', 2650),
(@p_pvc, '60*9T*2440', 'PVC 직각걸레받이 (무래핑 백색)', 1900);
-- ------------------------------------------
-- 6-9. 기타 몰딩
-- ------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_molding, '기타 몰딩', '바람막이 등');

SET @p_etc = (SELECT id FROM products WHERE company_id = @company_id AND name = '기타 몰딩' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
    (@p_etc, '30*9T*2440', '여닫이 바람막이', 2000);

-- =================================================================
-- 7. [필름] 데이터 상세 등록
-- =================================================================

-- (1) 기본 설정: 회사 ID 가져오기
SET @company_id = (SELECT id FROM companies WHERE code = 'CHEZNOUS' LIMIT 1);

-- (2) 카테고리 등록 ('FILM' 카테고리가 없으면 생성)
INSERT IGNORE INTO categories (company_id, name, code)
VALUES (@company_id, '인테리어 필름', 'FILM');

-- 필름 카테고리 ID 변수 설정
SET @cat_film = (SELECT id FROM categories WHERE company_id = @company_id AND code = 'FILM' LIMIT 1);

-- -----------------------------------------------------------------
-- 7-1. 일반 인테리어 필름 (기본)
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_film, '인테리어 필름 (일반)', '기본 인테리어 필름 및 엣지');

SET @p_film_basic = (SELECT id FROM products WHERE company_id = @company_id AND name = '인테리어 필름 (일반)' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_film_basic, '25m 1롤', '원롤', 120000),
(@p_film_basic, '1m 단위', 'M 단위 판매', 5500),
(@p_film_basic, '40mm*25m', '40mm * 25m', 4200);

-- -----------------------------------------------------------------
-- 7-2. 현대L&C 인테리어필름 ('S' 시리즈)
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_film, '현대L&C 필름 (S 시리즈)', '현대L&C 비방염 S 시리즈');

SET @p_film_s = (SELECT id FROM products WHERE company_id = @company_id AND name = '현대L&C 필름 (S 시리즈)' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_film_s, '25m 1롤', '원롤', 138000),
(@p_film_s, '1m 단위', 'M 단위 판매', 6300),
(@p_film_s, '40mm*25m', '40mm * 25m', 4200);

-- -----------------------------------------------------------------
-- 7-3. 현대L&C 인테리어필름 ('ZX' 시리즈)
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, description)
VALUES (@company_id, @cat_film, '현대L&C 필름 (ZX 시리즈)', '현대L&C 비방염 ZX 시리즈');

SET @p_film_zx = (SELECT id FROM products WHERE company_id = @company_id AND name = '현대L&C 필름 (ZX 시리즈)' LIMIT 1);

INSERT IGNORE INTO product_variants (product_id, spec_name, type_name, price) VALUES
(@p_film_zx, '25m 1롤', '원롤', 193000),
(@p_film_zx, '1m 단위', 'M 단위 판매', 8500),
(@p_film_zx, '40mm*25m', '40mm * 25m', 4200);

-- =================================================================
-- 8. [기타 제품] 데이터 등록
-- =================================================================

-- -----------------------------------------------------------------
-- 8-1. 도어락
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_doorlock, 'CHG-01 (다미)', 33000, 'CHG-01 (다미)'),
(@company_id, @cat_doorlock, 'BCL-1306 GR 그레이 (캡방식)', 10000, 'BCL-1306 GR 그레이 (결방식)'),
(@company_id, @cat_doorlock, 'BBL-950 (키 O)', 9200, 'BBL-950 (키모)'),
(@company_id, @cat_doorlock, 'BBL-951 GR 그레이', 8700, 'BBL-951 GR 그레이'),
(@company_id, @cat_doorlock, 'BBL-951 DG 다크그레이', 8700, 'BBL-951 DG 다크그레이'),
(@company_id, @cat_doorlock, 'BBL-101 SN', 11800, 'BBL-101 SN');

-- -----------------------------------------------------------------
-- 8-2. 오목이
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_recessed_handle, '골드', 3500, '골드'),
(@company_id, @cat_recessed_handle, '다크실버', 3500, '다크실버'),
(@company_id, @cat_recessed_handle, '블랙', 3500, '블랙'),
(@company_id, @cat_recessed_handle, '화이트', 3500, '화이트');

-- -----------------------------------------------------------------
-- 8-3. 이지경첩
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_easy_hinge, '실버', 2600, '실버'),
(@company_id, @cat_easy_hinge, '블랙', 3100, '블랙'),
(@company_id, @cat_easy_hinge, '골드', 4000, '골드');

-- -----------------------------------------------------------------
-- 8-4. 풀핸들 (340mm 25Ø)
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_pull_handle, '골드', 22000, '골드 (340mm 25Ø)'),
(@company_id, @cat_pull_handle, '실버(SUS)', 18000, '실버(SUS) (340mm 25Ø)'),
(@company_id, @cat_pull_handle, '블랙', 18000, '블랙 (340mm 25Ø)');

-- -----------------------------------------------------------------
-- 8-5. 도어스토퍼
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_door_stopper, '실버', 1900, '실버'),
(@company_id, @cat_door_stopper, '블랙', 1900, '블랙'),
(@company_id, @cat_door_stopper, '화이트', 1900, '화이트');

-- -----------------------------------------------------------------
-- 8-6. 포장용 보호 필름
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_packaging_film, '50mm / 200M', 4800, '50mm / 200M'),
(@company_id, @cat_packaging_film, '100mm / 200M', 9500, '100mm / 200M');

-- -----------------------------------------------------------------
-- 8-7. 기타철물
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_other_hardware, '오메가레일(6자)', 9000, '오메가레일(6자)'),
(@company_id, @cat_other_hardware, '오메가 호차', 1800, '오메가 호차'),
(@company_id, @cat_other_hardware, '연동용 호차', 2000, '연동용 호차'),
(@company_id, @cat_other_hardware, '엣지풀', 3000, '엣지풀'),
(@company_id, @cat_other_hardware, 'L가이드', 4200, 'L가이드'),
(@company_id, @cat_other_hardware, '슬라이딩 락 DSL250 NI', 28000, '슬라이딩 락 DSL250 NI'),
(@company_id, @cat_other_hardware, '손끼임방지 (8자)', 33000, '손끼임방지 (8자)'),
(@company_id, @cat_other_hardware, '외줄 v레일 (6자)', 7000, '외줄 v레일 (6자)'),
(@company_id, @cat_other_hardware, '2줄 미서기 통레일 (V레일 6자)', 19000, '2줄 미서기 통레일 (V레일 6자)'),
(@company_id, @cat_other_hardware, '아교오도시', 3000, '아교오도시'),
(@company_id, @cat_other_hardware, '자석캐치 (소)', 1200, '자석캐치 (소)'),
(@company_id, @cat_other_hardware, '자석캐치 (대)', 1800, '자석캐치 (대)');

-- -----------------------------------------------------------------
-- 8-8. 행거 하드웨어 (SET)
-- -----------------------------------------------------------------
INSERT IGNORE INTO products (company_id, category_id, name, base_price, description)
VALUES 
(@company_id, @cat_hanger_hardware, '일반형 행거슬림세트 (2M, 40kg)', 45000, '일반형 행거슬림세트 (2M, 40kg) - 양방향 댐퍼 기본포함');