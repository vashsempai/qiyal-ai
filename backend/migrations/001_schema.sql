-- PostgreSQL Schema for Qiyal.ai
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('freelancer', 'client', 'admin')),
    avatar VARCHAR(255),
    bio TEXT,
    skills JSONB DEFAULT '[]',
    hourly_rate INTEGER DEFAULT 0,
    location VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    balance INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    skills JSONB NOT NULL DEFAULT '[]',
    budget_min INTEGER NOT NULL,
    budget_max INTEGER NOT NULL,
    deadline DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'published',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data
INSERT INTO users (email, password, name, role) VALUES
('admin@qiyal.ai', '$2b$10$example', 'Admin User', 'admin'),
('freelancer@qiyal.ai', '$2b$10$example', 'Test Freelancer', 'freelancer'),
('client@qiyal.ai', '$2b$10$example', 'Test Client', 'client');
