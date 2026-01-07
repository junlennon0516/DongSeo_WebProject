-- 기존 테이블의 ID 컬럼 타입을 BIGINT로 변경하는 스크립트
-- Foreign Key 제약조건을 먼저 삭제하고, 컬럼 타입을 변경한 후 다시 생성

-- 1. Foreign Key 제약조건 삭제 (제약조건 이름 확인 필요)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'options' 
     AND CONSTRAINT_NAME = 'options_ibfk_1') > 0,
    'ALTER TABLE options DROP FOREIGN KEY options_ibfk_1;',
    'SELECT 1;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 간단한 방법: 모든 Foreign Key를 찾아서 삭제
SET FOREIGN_KEY_CHECKS = 0;

-- 2. ID 컬럼 타입 변경
ALTER TABLE companies MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE categories MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE categories MODIFY COLUMN company_id BIGINT NOT NULL;
ALTER TABLE products MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE products MODIFY COLUMN company_id BIGINT NOT NULL;
ALTER TABLE products MODIFY COLUMN category_id BIGINT NOT NULL;
ALTER TABLE options MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE options MODIFY COLUMN company_id BIGINT NOT NULL;
ALTER TABLE options MODIFY COLUMN category_id BIGINT;
ALTER TABLE product_variants MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE product_variants MODIFY COLUMN product_id BIGINT NOT NULL;
ALTER TABLE price_matrix MODIFY COLUMN id BIGINT AUTO_INCREMENT;
ALTER TABLE price_matrix MODIFY COLUMN product_id BIGINT NOT NULL;

-- 3. Foreign Key 제약조건 재생성
ALTER TABLE categories ADD CONSTRAINT categories_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE products ADD CONSTRAINT products_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE products ADD CONSTRAINT products_ibfk_2 FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE options ADD CONSTRAINT options_ibfk_1 FOREIGN KEY (company_id) REFERENCES companies(id);
ALTER TABLE options ADD CONSTRAINT options_ibfk_2 FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE product_variants ADD CONSTRAINT product_variants_ibfk_1 FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE price_matrix ADD CONSTRAINT price_matrix_ibfk_1 FOREIGN KEY (product_id) REFERENCES products(id);

SET FOREIGN_KEY_CHECKS = 1;

