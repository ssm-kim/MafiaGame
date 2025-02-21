-- Create database if not exists
CREATE DATABASE IF NOT EXISTS game_db;
USE game_db;

-- Drop tables if they exist
DROP TABLE IF EXISTS game_log;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS member;

-- Create member table
CREATE TABLE member (
    member_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    last_activity_time DATETIME(6),
    lose BIGINT DEFAULT 0,
    win BIGINT DEFAULT 0,
    email VARCHAR(255),
    nickname VARCHAR(255) NOT NULL,
    provider_id VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED') DEFAULT 'ACTIVE',
    updated_at DATETIME(6) NOT NULL
);

-- Create room table
CREATE TABLE room (
    room_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    required_players INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    host_id BIGINT NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    password VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    status ENUM('WAITING', 'PLAYING', 'FINISHED') DEFAULT 'WAITING',
    FOREIGN KEY (host_id) REFERENCES member(member_id)
);

-- Create game_log table
CREATE TABLE game_log (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_cnt INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    game_id BIGINT NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    version VARCHAR(255),
    status ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELED') DEFAULT 'IN_PROGRESS',
    win_role ENUM('MAFIA', 'CITIZEN')
);

-- Insert test member data
INSERT INTO member 
(member_id, nickname, email, created_at, updated_at, provider_id) 
VALUES 
(1, '초보환영방장', 'beginnerhost@test.com', NOW(), NOW(), 'host001'),
(2, '실력자방장', 'prohost@test.com', NOW(), NOW(), 'host002'),
(3, '친구방방장', 'friendhost@test.com', NOW(), NOW(), 'host003'),
(4, '초보방장', 'newbiehost@test.com', NOW(), NOW(), 'host004');

-- Reset auto increment for room table
ALTER TABLE room AUTO_INCREMENT = 1;

-- Insert room test data
INSERT INTO room 
(room_id, host_id, required_players, title, password, created_at, updated_at) 
VALUES 
(1, 1, 6, '초보도 환영! 같이 즐겨요~', NULL, NOW(), NOW()),
(2, 2, 6, '실력자만! 빠른게임 고고', NULL, NOW(), NOW()),
(3, 3, 7, '친구들끼리만 하실분!', '1234', NOW(), NOW()),
(4, 4, 8, '초보만 오세요 ~', NULL, NOW(), NOW());

-- Insert sample game logs
INSERT INTO game_log 
(player_cnt, game_id, created_at, updated_at, version, status, win_role) 
VALUES 
(6, 1, NOW(), NOW(), '1.0.0', 'COMPLETED', 'CITIZEN'),
(6, 2, NOW(), NOW(), '1.0.0', 'COMPLETED', 'MAFIA'),
(7, 3, NOW(), NOW(), '1.0.0', 'IN_PROGRESS', NULL),
(8, 4, NOW(), NOW(), '1.0.0', 'CANCELED', NULL);
