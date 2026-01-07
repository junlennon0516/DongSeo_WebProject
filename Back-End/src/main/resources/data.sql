-- 1. 회사 (companies) 등록
INSERT INTO companies (name, code) VALUES ('쉐누', 'CHEZNOUS');

-- 2. 카테고리 (Categories) 등록 (company_id는 1로 가정)
INSERT INTO categories (company_id, name, code) VALUES
(1, 'ABS 도어', 'DOOR'),
(1, '문틀', 'FRAME'),
(1, '3연동 중문', 'INTERLOCK'),
(1, '목창호', 'WINDOW'),
(1, '몰딩', 'MOLDING');

-- 3. [문틀] 데이터 등록
-- 3-1. 제품 등록 (category_id는 2로 가정 - 문틀)
INSERT INTO products (company_id, category_id, name, description)
VALUES (1, 2, '발포문틀', 'PVC (110~245바)');

-- 3-2. 규격별 단가 (product_variants) - product_id는 1로 가정
INSERT INTO product_variants (product_id, spec_name, type_name, price) VALUES
(1, '110바', '일반형 3방', 39000),
(1, '110바', '일반형 4방', 42000),
(1, '110바', '가스켓 3방', 43000),
(1, '130바', '일반형 3방', 46000),
(1, '130바', '가스켓 3방', 50000),
(1, '140바', '일반형 3방', 47000),
(1, '155바', '일반형 3방', 52000),
(1, '175바', '일반형 3방', 60000),
(1, '195바', '일반형 3방', 64000);

-- 3-3. 문틀 옵션 (category_id는 2로 가정)
INSERT INTO options (company_id, category_id, name, add_price) VALUES
(1, 2, '문틀타공시', 2000),
(1, 2, '보양작업비', 1000),
(1, 2, '보양재 단가', 2000);

-- 4. [3연동 중문] 데이터 등록
-- 4-1. 제품 등록 (category_id는 3으로 가정 - 3연동 중문)
INSERT INTO products (company_id, category_id, name, description)
VALUES (1, 3, '목재 3연동', '기본 목재 3연동 중문 세트');

-- 4-2. 범위별 단가표 (product_id는 2로 가정)
-- A. 기본 세트 가격 (문틀 + 하드웨어 + 기본도어)
INSERT INTO price_matrix (product_id, option_name, max_width, price) VALUES
(2, '기본세트', 1250, 285000),
(2, '기본세트', 1350, 295000),
(2, '기본세트', 1550, 305000),
(2, '기본세트', 1650, 325000),
(2, '기본세트', 1850, 345000),
(2, '기본세트', 2150, 385000);

-- B. 유리 옵션 (사이즈별 가격이 다름) - 투명 5T
INSERT INTO price_matrix (product_id, option_name, max_width, price) VALUES
(2, '투명유리 (5T) 포함', 1250, 348000),
(2, '투명유리 (5T) 포함', 1350, 365000),
(2, '투명유리 (5T) 포함', 1550, 389000),
(2, '투명유리 (5T) 포함', 1850, 445000);

-- C. 망입유리 옵션
INSERT INTO price_matrix (product_id, option_name, max_width, price) VALUES
(2, '망입유리 (5T) 포함', 1250, 447000),
(2, '망입유리 (5T) 포함', 1350, 468000),
(2, '망입유리 (5T) 포함', 1850, 595000);

-- 4-3. 중문 옵션 (category_id는 3으로 가정)
INSERT INTO options (company_id, category_id, name, add_price) VALUES
(1, 3, '하단 고시형 추가', 30000),
(1, 3, '유리 강화(규격별 상이-로직처리필요)', 0);

-- 5. [ABS 도어] 데이터 등록
-- 5-1. 제품 등록 (민자, 디자인) - category_id는 1로 가정
INSERT INTO products (company_id, category_id, name, base_price)
VALUES (1, 1, 'ABS 민자', 57000);

INSERT INTO products (company_id, category_id, name, base_price)
VALUES (1, 1, 'ABS 디자인(오르토/디엔)', 58000);

-- 5-2. 도어 옵션 (options) - category_id는 1로 가정
INSERT INTO options (company_id, category_id, name, add_price) VALUES
(1, 1, '양면 엣지', 1000),
(1, 1, '손잡이부 심재 보강', 3000),
(1, 1, '좌우 다대 심재보강', 8000),
(1, 1, '오목이 부착', 13000),
(1, 1, '엣지풀 부착', 10000);

-- 6. [몰딩] 데이터 등록
-- 6-1. 제품 등록 (category_id는 5로 가정 - 몰딩)
INSERT INTO products (company_id, category_id, name)
VALUES (1, 5, '평몰딩');

-- 6-2. 규격별 단가 (product_variants) - product_id는 5로 가정
INSERT INTO product_variants (product_id, spec_name, type_name, price) VALUES
(5, '30*9T*2440', '3전 평판', 1320),
(5, '40*9T*2440', '4전 평판', 1500),
(5, '50*9T*2440', '5전 평판', 1730),
(5, '60*9T*2440', '6전 평판', 1870),
(5, '80*9T*2440', '8전 평판', 2300),
(5, '100*9T*2440', '10전 평판', 2780);

-- 몰딩 관련(인테리어 필름 등)은 별도 제품으로 등록하거나 옵션으로 처리
INSERT INTO products (company_id, category_id, name, base_price)
VALUES (1, 5, '인테리어필름(25m 1롤)', 120000);
