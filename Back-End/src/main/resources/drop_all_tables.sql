-- 모든 테이블 삭제 (Foreign Key 제약조건 때문에 순서 중요)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS price_matrix;
DROP TABLE IF EXISTS product_variants;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS companies;

SET FOREIGN_KEY_CHECKS = 1;





