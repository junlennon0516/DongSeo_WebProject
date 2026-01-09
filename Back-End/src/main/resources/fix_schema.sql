-- 기존 테이블의 ID 컬럼 타입을 BIGINT로 변경하는 스크립트
-- Foreign Key 제약조건을 먼저 삭제하고, 컬럼 타입을 변경한 후 다시 생성

-- 1. Foreign Key 체크 비활성화
SET FOREIGN_KEY_CHECKS = 0;

-- 2. 모든 Foreign Key 제약조건 삭제
-- 동적으로 Foreign Key를 찾아서 삭제
SET @drop_fk = NULL;

SELECT GROUP_CONCAT(
    CONCAT('ALTER TABLE ', TABLE_NAME, ' DROP FOREIGN KEY ', CONSTRAINT_NAME)
    SEPARATOR '; '
)
INTO @drop_fk
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
AND CONSTRAINT_TYPE = 'FOREIGN KEY'
AND TABLE_NAME IN ('categories', 'products', 'options', 'product_variants', 'price_matrix');

-- Foreign Key가 있는 경우에만 삭제 실행
SET @drop_fk = IFNULL(@drop_fk, 'SELECT 1 AS no_fk');
SET @drop_fk = CONCAT(@drop_fk, ';');

PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2-1. 중복 데이터 정리 (UNIQUE 제약조건 추가 전에 실행)
-- products 테이블 중복 삭제
DELETE p1 FROM products p1
INNER JOIN products p2 
WHERE p1.id > p2.id 
AND p1.company_id = p2.company_id 
AND p1.category_id = p2.category_id 
AND p1.name = p2.name;

-- options 테이블 중복 삭제
DELETE o1 FROM options o1
INNER JOIN options o2 
WHERE o1.id > o2.id 
AND o1.company_id = o2.company_id 
AND (o1.product_id = o2.product_id OR (o1.product_id IS NULL AND o2.product_id IS NULL))
AND o1.name = o2.name;

-- 3. ID 컬럼 타입 변경 (모든 관련 컬럼을 BIGINT로 변경)
ALTER TABLE companies MODIFY COLUMN id BIGINT AUTO_INCREMENT;

ALTER TABLE categories MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE categories MODIFY COLUMN company_id BIGINT NOT NULL;

ALTER TABLE products MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE products MODIFY COLUMN company_id BIGINT NOT NULL;
ALTER TABLE products MODIFY COLUMN category_id BIGINT NOT NULL;

ALTER TABLE options MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE options MODIFY COLUMN company_id BIGINT NOT NULL;
ALTER TABLE options MODIFY COLUMN category_id BIGINT;
-- product_id 컬럼 추가 (NULL 허용) - 이미 존재하는 경우 오류 무시
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'options' 
    AND COLUMN_NAME = 'product_id'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE options ADD COLUMN product_id BIGINT;',
    'SELECT 1 AS column_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE product_variants MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE product_variants MODIFY COLUMN product_id BIGINT NOT NULL;

-- categories 테이블에 parent_id 컬럼 추가 (NULL 허용) - 메인/세부 카테고리 구조
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'categories' 
    AND COLUMN_NAME = 'parent_id'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE categories ADD COLUMN parent_id BIGINT;',
    'SELECT 1 AS column_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- product_variants 테이블에 note 컬럼 추가 (NULL 허용)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'product_variants' 
    AND COLUMN_NAME = 'note'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE product_variants ADD COLUMN note VARCHAR(255) DEFAULT NULL;',
    'SELECT 1 AS column_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE price_matrix MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE price_matrix MODIFY COLUMN product_id BIGINT NOT NULL;

-- 3-1. UNIQUE 제약조건 추가 (중복 방지)
-- products 테이블에 (company_id, category_id, name) 조합이 유일하도록 제약조건 추가
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'products' 
    AND CONSTRAINT_NAME = 'uk_product_unique'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE products ADD CONSTRAINT uk_product_unique UNIQUE (company_id, category_id, name);',
    'SELECT 1 AS constraint_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- options 테이블에 (company_id, product_id, name) 조합이 유일하도록 제약조건 추가
-- product_id가 NULL인 경우는 (company_id, category_id, name) 조합으로 유일성 보장
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'options' 
    AND CONSTRAINT_NAME = 'uk_option_unique'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE options ADD CONSTRAINT uk_option_unique UNIQUE (company_id, product_id, name);',
    'SELECT 1 AS constraint_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- product_variants 테이블에 (product_id, spec_name, type_name) 조합이 유일하도록 제약조건 추가
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'product_variants' 
    AND CONSTRAINT_NAME = 'uk_product_variant_unique'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE product_variants ADD CONSTRAINT uk_product_variant_unique UNIQUE (product_id, spec_name, type_name);',
    'SELECT 1 AS constraint_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Foreign Key 제약조건 재생성
ALTER TABLE categories 
    ADD CONSTRAINT categories_ibfk_1 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- categories 테이블에 parent_id Foreign Key 제약조건 추가
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'categories' 
    AND CONSTRAINT_NAME = 'categories_ibfk_2'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE categories ADD CONSTRAINT categories_ibfk_2 FOREIGN KEY (parent_id) REFERENCES categories(id);',
    'SELECT 1 AS constraint_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE products 
    ADD CONSTRAINT products_ibfk_1 
    FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE products 
    ADD CONSTRAINT products_ibfk_2 
    FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE options 
    ADD CONSTRAINT options_ibfk_1 
    FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE options 
    ADD CONSTRAINT options_ibfk_2 
    FOREIGN KEY (category_id) REFERENCES categories(id);

-- options 테이블에 product_id Foreign Key 제약조건 추가
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'options' 
    AND CONSTRAINT_NAME = 'options_ibfk_3'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE options ADD CONSTRAINT options_ibfk_3 FOREIGN KEY (product_id) REFERENCES products(id);',
    'SELECT 1 AS constraint_already_exists;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE product_variants 
    ADD CONSTRAINT product_variants_ibfk_1 
    FOREIGN KEY (product_id) REFERENCES products(id);

ALTER TABLE price_matrix 
    ADD CONSTRAINT price_matrix_ibfk_1 
    FOREIGN KEY (product_id) REFERENCES products(id);

-- 5. Foreign Key 체크 재활성화
SET FOREIGN_KEY_CHECKS = 1;
