CREATE DATABASE IF NOT EXISTS forex_academy CHARACTER SET utf8mb4;
USE forex_academy;
CREATE TABLE users(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100),email VARCHAR(150) UNIQUE,password VARCHAR(255),role ENUM('user','admin') DEFAULT 'user',premium_until DATETIME NULL,token VARCHAR(64) NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE signals(id INT AUTO_INCREMENT PRIMARY KEY,pair VARCHAR(30),broker ENUM('Deriv','Weltrade'),direction ENUM('BUY','SELL'),entry VARCHAR(30),tp VARCHAR(30),sl VARCHAR(30),note TEXT,image VARCHAR(200),status ENUM('active','tp_hit','sl_hit') DEFAULT 'active',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE results(id INT AUTO_INCREMENT PRIMARY KEY,title VARCHAR(150),pair VARCHAR(30),outcome ENUM('win','loss','breakeven'),pips VARCHAR(20),image VARCHAR(200),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE pdfs(id INT AUTO_INCREMENT PRIMARY KEY,title VARCHAR(150),description TEXT,file VARCHAR(200),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE mentorships(id INT AUTO_INCREMENT PRIMARY KEY,title VARCHAR(150),description TEXT,price VARCHAR(30),duration VARCHAR(50));
CREATE TABLE payments(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,kind ENUM('subscription','mentorship'),mentorship_id INT NULL,reference VARCHAR(200),status ENUM('pending','approved','rejected') DEFAULT 'pending',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
INSERT INTO mentorships(title,description,price,duration) VALUES
('Foundations Mentorship','Market structure, risk management and your first profitable routine.','$99','4 weeks'),
('Pro Trader Mentorship','1-on-1 live sessions, trade reviews and a personal trading plan.','$249','8 weeks');
