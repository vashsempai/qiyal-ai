-- Install UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for Users
CREATE TYPE user_availability_status AS ENUM('available', 'busy', 'away');
CREATE TYPE user_account_status AS ENUM('active', 'suspended', 'banned', 'deleted');
CREATE TYPE user_subscription_plan AS ENUM('free', 'basic', 'pro', 'enterprise');
CREATE TYPE user_profile_visibility AS ENUM('public', 'limited', 'private');
CREATE TYPE provider_type AS ENUM('google', 'facebook', 'github', 'linkedin', 'apple');

-- Core user table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP,
    phone VARCHAR(20) UNIQUE,
    phone_verified_at TIMESTAMP,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    cover_image_url VARCHAR(500),

    -- Location & Preferences
    country VARCHAR(2), -- ISO country code
    city VARCHAR(100),
    timezone VARCHAR(50),
    language VARCHAR(5) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',

    -- Professional Information
    title VARCHAR(200),
    hourly_rate DECIMAL(10,2),
    availability_status user_availability_status DEFAULT 'available',

    -- Platform Statistics
    total_earnings DECIMAL(15,2) DEFAULT 0,
    total_withdrawn DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    total_projects_completed INTEGER DEFAULT 0,
    total_hours_worked INTEGER DEFAULT 0,

    -- Ratings & Reviews
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,

    -- Gamification
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    achievement_points INTEGER DEFAULT 0,

    -- Account Status
    account_status user_account_status DEFAULT 'active',
    last_online_at TIMESTAMP,

    -- Subscription & Verification
    subscription_plan user_subscription_plan DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,

    -- Privacy Settings
    profile_visibility user_profile_visibility DEFAULT 'public',
    show_earnings BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(account_status);
CREATE INDEX idx_users_rating ON users(average_rating);
CREATE INDEX idx_users_created ON users(created_at);

-- User external logins (OAuth)
CREATE TABLE user_external_logins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider provider_type,
    provider_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_name VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (provider, provider_id)
);

-- User sessions and devices
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location_country VARCHAR(2),
    location_city VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_sessions table
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);