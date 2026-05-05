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