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