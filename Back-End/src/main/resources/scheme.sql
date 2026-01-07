-- 쉐누 종합 단가표 먼저 적용
-- 1. 회사 정보 테이블
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 거래처명: 쉐누, 예림, 우딘 등
    code VARCHAR(20) UNIQUE NOT NULL, -- CHENU, YERIM
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 카테고리 (회사별로 카테고리 구성 다를 수 있음)
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL, -- 어떤 회사 것인지
  name VARCHAR(50) NOT NULL,
  code VARCHAR(20) NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  UNIQUE (company_id, code) -- 같은 회사 내에서는 코드 중복 불가
);

-- 3. 제품 테이블
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    base_price INT DEFAULT 0,
    description VARCHAR(255),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 4. 제품 변형/규격 테이블 (문틀 규격 등)
CREATE TABLE product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    spec_name VARCHAR(100),
    type_name VARCHAR(100),
    price INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 5. 범위별 단가표 (중문 등)
CREATE TABLE price_matrix (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    option_name VARCHAR(100),
    max_width INT DEFAULT 99999,
    max_height INT DEFAULT 99999,
    price INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 6. 옵션 테이블
CREATE TABLE options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    add_price INT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);