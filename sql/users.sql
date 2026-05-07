CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('market', 'consumer') NOT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    full_name VARCHAR(100),
    market_name VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    verification_code VARCHAR(6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    market_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    stock INT NOT NULL,
    normal_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2) NOT NULL,
    expiration_date DATE NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (market_id) REFERENCES users(id)
);

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consumer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (consumer_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,

    UNIQUE KEY unique_cart_item (consumer_id, product_id)
);

INSERT INTO users (email, password_hash, role, is_verified, full_name, market_name, city, district, verification_code) VALUES
('araz@example.com', 'hashedpassword1', 'market', 1, 'Rashad Aliyev', 'Araz Supermarket', 'Baku', 'Nasimi', '123456'),
('bravo@example.com', 'hashedpassword2', 'market', 1, 'Nigar Mammadova', 'Bravo Market', 'Baku', 'Yasamal', '654321'),
('bazarstore@example.com', 'hashedpassword3', 'market', 1, 'Elvin Hasanov', 'Bazarstore', 'Baku', 'Nizami', '111222');

INSERT INTO products (market_id, title, stock, normal_price, discounted_price, expiration_date, image) VALUES
(1, 'Qatiq 1L', 40, 3.50, 3.00, '2026-05-20', 'qatiq.png'),
(1, 'Sud 1L', 60, 2.20, 2.00, '2026-05-18', 'milk.png'),
(1, 'Corek', 100, 0.80, 0.70, '2026-05-10', 'bread.png'),
(1, 'Yumurta 10 eded', 70, 3.00, 2.70, '2026-05-25', 'eggs.png'),

(2, 'Toyuq filesi 1kg', 30, 6.50, 5.80, '2026-05-15', 'chicken.png'),
(2, 'Pendir 500g', 45, 5.00, 4.50, '2026-06-01', 'cheese.png'),
(2, 'Kefir 1L', 50, 2.50, 2.20, '2026-05-19', 'kefir.png'),
(2, 'Alma 1kg', 90, 2.00, 1.80, '2026-05-22', 'apple.png'),

(3, 'Nar 1kg', 80, 4.00, 3.50, '2026-05-25', 'pomegranate.png'),
(3, 'Pomidor 1kg', 70, 2.80, 2.50, '2026-05-14', 'tomato.png'),
(3, 'Xiyar 1kg', 65, 2.60, 2.30, '2026-05-13', 'cucumber.png'),
(3, 'Kartof 1kg', 100, 1.50, 1.30, '2026-06-10', 'potato.png'),
(3, 'Sogan 1kg', 90, 1.40, 1.20, '2026-06-12', 'onion.png');